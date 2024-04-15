// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

/* eslint-disable import/no-unresolved */
import {
  commands,
  workspace,
  window,
  ExtensionContext,
  TextDocumentChangeEvent,
  TextEditor,
  TextDocument,
  DiagnosticCollection,
  languages,
  Uri,
  Diagnostic,
  Position,
  Range,
  ConfigurationChangeEvent,
  WorkspaceFoldersChangeEvent,
  TelemetryLogger,
} from 'vscode';
import path from 'path';
import debounce from 'p-debounce';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import * as fs from 'fs';
import { DeployResult } from '@edfi/metaed-odsapi-deploy';
import { showErrorNotification, showInfoNotification, yieldToNextMacroTask } from './Utility';
import { acceptedLicense, allianceMode, getOdsApiDeploymentDirectory, suppressDeleteOnDeploy } from './ExtensionSettings';
import type { DeployParameters } from '../model/DeployParameters';
import { createServerMessage } from './ServerMessageFactory';
import type { ServerMessage } from '../model/ServerMessage';
import { bundledDsRootPath, ensureBundledDsReadOnly, isBundledDataStandardProjectInWorkspace } from './DataStandardManager';

let client: LanguageClient;
// @ts-ignore - telemetryLogger never read, but is being used by VS Code
let telemetryLogger: TelemetryLogger | null = null;
const acceptedLicenseDiagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection('acceptedLicense');

const sendLintCommandToServer: () => Promise<void> = debounce(async () => {
  // Only lint when agreement is accepted
  if (!acceptedLicense()) return;

  const serverMessage: ServerMessage | undefined = await createServerMessage(client.outputChannel, {
    showUiNotifications: false,
  });

  // Silently do nothing if the is nothing to lint
  if (serverMessage == null) return;

  await client.sendNotification('metaed/lint', serverMessage);
}, 500);

/**
 * True if both the file part of a MetaEd project (associated with the MetaEd extension) and ends in .metaed
 */
function isDotMetaEdFile(document: TextDocument): boolean {
  return document?.languageId === 'metaed' && document.uri.path.endsWith('.metaed');
}

function isValidDirectory(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Adds event subscriptions for MetaEd VS Code command and document/editor listeners,
 * along with listeners for server events
 */
async function addSubscriptions(context: ExtensionContext) {
  // Build command from user
  context.subscriptions.push(
    commands.registerCommand('metaed.build', () => {
      (async () => {
        if (!acceptedLicense()) {
          await showErrorNotification(
            'You must first accept the Ed-Fi License Agreement under File -> Preferences -> Settings.',
          );
          return;
        }

        const serverMessage: ServerMessage | undefined = await createServerMessage(client.outputChannel);
        if (serverMessage == null) {
          await showErrorNotification('Nothing to build.');
          return;
        }

        await client.sendNotification('metaed/build', serverMessage);
        await showInfoNotification('Building MetaEd...');
      })();
    }),
  );

  // Deploy command from user
  context.subscriptions.push(
    commands.registerCommand('metaed.deploy', () => {
      (async () => {
        const deployDirectoryPath = getOdsApiDeploymentDirectory();
        const implementationFolderPath = path.join(deployDirectoryPath, 'Ed-Fi-ODS-Implementation');
        const odsFolderPath = path.join(deployDirectoryPath, 'Ed-Fi-ODS');
        const drivePattern = /[a-zA-Z]:/;
        const endsWithSlash = /[/\\]$/;

        if (!acceptedLicense()) {
          await showErrorNotification(
            'You must first accept the Ed-Fi License Agreement under File -> Preferences -> Settings.',
          );
          return;
        }

        if (deployDirectoryPath === '') {
          await showErrorNotification('To deploy, set Ods Api Deployment Directory under File -> Preferences -> Settings.');
          return;
        }
        if (!isValidDirectory(deployDirectoryPath)) {
          await showErrorNotification(
            'Directory path not found, set proper Ods Api Deployment Directory under File -> Preferences -> Settings.',
          );
          return;
        }
        if (process.platform === 'win32') {
          const drive = deployDirectoryPath.substring(0, 3);
          if (drivePattern.test(deployDirectoryPath) && !endsWithSlash.test(drive)) {
            await showErrorNotification(
              'If Ed-Fi-ODS and Ed-Fi-ODS-Implementation folders are directly under a Drive(Example: C:, D:), then make sure to include path separating character at the end(Example: C:\\ or D:/). Correct Ods Api Deployment Directory can be set under File -> Preferences -> Settings.',
            );
            return;
          }
        }
        if (!isValidDirectory(implementationFolderPath) || !isValidDirectory(odsFolderPath)) {
          await showErrorNotification(
            'API source directory is not correctly pointing to a folder that has Ed-Fi-ODS-Implementation and Ed-Fi-ODS folders. Please make sure to set correct Ods Api Deployment Directory under File -> Preferences -> Settings.',
          );
          return;
        }

        const serverMessage: ServerMessage | undefined = await createServerMessage(client.outputChannel);
        if (serverMessage == null) {
          await showErrorNotification('Nothing to deploy.');
          return;
        }

        const { metaEdConfiguration }: ServerMessage = serverMessage;

        // Is there anything to deploy? (In allianceMode, core always gets deployed)
        if (!metaEdConfiguration.allianceMode && metaEdConfiguration.projects.length <= 1) {
          await showErrorNotification('No extension to deploy.');
          return;
        }

        const deployParameters: DeployParameters = {
          serverMessage,
          deployCore: allianceMode(),
          suppressDelete: suppressDeleteOnDeploy(),
        };
        await client.sendNotification('metaed/deploy', deployParameters);
        await showInfoNotification('Deploying MetaEd...');
      })();
    }),
  );

  // Lint command directly from user
  context.subscriptions.push(
    commands.registerCommand('metaed.lint', () => {
      (async () => {
        await sendLintCommandToServer();
      })();
    }),
  );

  // Crash for testing of exception reporting
  context.subscriptions.push(
    commands.registerCommand('metaed.crash', () => {
      (() => {
        // @ts-ignore - intentionally undefined
        thisCrashTrigger.is(undefined); // eslint-disable-line no-undef
      })();
    }),
  );

  // Listener for text editor change e.g. user changed tab
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((textEditor: TextEditor | undefined) => {
      if (textEditor != null && isDotMetaEdFile(textEditor.document)) {
        client.outputChannel.appendLine(`${Date.now()}: client onDidChangeActiveTextEditor sending lint command to server`);
        (async () => {
          await sendLintCommandToServer();
        })();
      }
    }),
  );

  // Listener for .metaed file change
  context.subscriptions.push(
    workspace.onDidChangeTextDocument((changeEvent: TextDocumentChangeEvent) => {
      if (isDotMetaEdFile(changeEvent.document)) {
        client.outputChannel.appendLine(`${Date.now()}: client onDidChangeTextDocument sending lint command to server`);
        (async () => {
          await sendLintCommandToServer();
        })();
      }
    }),
  );

  // Listener for .metaed file tab closed
  context.subscriptions.push(
    workspace.onDidCloseTextDocument((textDocument: TextDocument) => {
      if (isDotMetaEdFile(textDocument)) {
        client.outputChannel.appendLine(`${Date.now()}: client onDidCloseTextDocument sending lint command to server`);
        (async () => {
          await sendLintCommandToServer();
        })();
      }
    }),
  );

  // Listen for buildComplete message from server
  context.subscriptions.push(
    client.onNotification('metaed/buildComplete', (success: boolean) => {
      (async () => {
        if (success) {
          await showInfoNotification(
            `MetaEd build success: Find results in 'MetaEdOutput' folder. You may need to refresh the VS Code file explorer.`,
          );
        } else {
          await showErrorNotification('MetaEd build failure - see Problems window');
        }
      })();
    }),
  );

  // Listen for deployComplete message from server
  context.subscriptions.push(
    client.onNotification('metaed/deployComplete', (deployResult: DeployResult) => {
      (async () => {
        if (deployResult.success) {
          await showInfoNotification(
            `MetaEd deploy success: Find results under '${getOdsApiDeploymentDirectory()}' ODS/API folder.`,
          );
        } else {
          await showErrorNotification(`'MetaEd deploy failure: ${deployResult.failureMessage}'`);
        }
      })();
    }),
  );
}

/**
 * Sync the accepted license diagnostic message to the acceptedLicense status
 */
async function syncAcceptedLicenseDiagnostic() {
  if (acceptedLicense()) {
    acceptedLicenseDiagnosticCollection.clear();
    // Give an initial lint once license accepted
    await sendLintCommandToServer();
  } else {
    acceptedLicenseDiagnosticCollection.set(Uri.parse('metaed:Ed-Fi License Needs Accepting', true), [
      new Diagnostic(
        new Range(new Position(0, 0), new Position(0, 0)),
        'Please accept the Ed-Fi License Agreement under File -> Preferences -> Settings',
      ),
    ]);
  }
}

/**
 * Subscribe to workspace folder changes, ensuring that if a bundled DS project is added that the files are read-only
 */
export async function listenForWorkspaceFolderChange(context: ExtensionContext) {
  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(async (event: WorkspaceFoldersChangeEvent) => {
      await yieldToNextMacroTask();
      if (event.added.length > 0) {
        await ensureBundledDsReadOnly();
        await yieldToNextMacroTask();
      }
    }),
  );
}

/**
 * Subscribe to acceptedLicense settings change, triggering sync with problems window
 */
export async function listenForAcceptedLicenseChange(context: ExtensionContext) {
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async (event: ConfigurationChangeEvent) => {
      await yieldToNextMacroTask();
      if (!event.affectsConfiguration('metaed.acceptedLicense')) return;

      await syncAcceptedLicenseDiagnostic();
      await yieldToNextMacroTask();
    }),
  );
}

/**
 * Extension lifecycle function invoked by VS Code to activate extension
 */
export async function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server', 'LanguageServer.js'));
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    // Register the server for metaed documents
    documentSelector: [{ scheme: 'file', language: 'metaed' }],
    synchronize: {
      // Notify the server about file changes to metaed files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.metaed'),
    },
  };

  // Start the client. This will also launch the server
  client = new LanguageClient('MetaEd', 'MetaEd', serverOptions, clientOptions);
  await client.start();

  client.outputChannel.appendLine(`${Date.now()}: MetaEd extension is starting...`);

  await addSubscriptions(context);

  // Trigger an initial lint after extension startup is complete
  if (window.activeTextEditor != null) {
    await sendLintCommandToServer();
  }

  await listenForAcceptedLicenseChange(context);
  await listenForWorkspaceFolderChange(context);
  await syncAcceptedLicenseDiagnostic();
  await yieldToNextMacroTask();

  await ensureBundledDsReadOnly();
  await yieldToNextMacroTask();

  client.outputChannel.appendLine('MetaEd has started 🎬 ');

  if (!isBundledDataStandardProjectInWorkspace() && !allianceMode()) {
    // eslint-disable-next-line no-void
    void window
      .showInformationMessage(
        `MetaEd has started 🎬 MetaEd requires a Data Standard project in the workspace. Bundled versions are at ${bundledDsRootPath()}`,
        'Open Folder Location',
      )
      .then(async (selection) => {
        if (selection === 'Open Folder Location') {
          await window
            .showOpenDialog({
              defaultUri: Uri.file(bundledDsRootPath()),
              canSelectFolders: true,
              canSelectFiles: false,
            })
            .then(async (folderUri) => {
              if (folderUri && folderUri[0]) {
                workspace.updateWorkspaceFolders(0, 0, { uri: Uri.file(folderUri[0].fsPath) });
              }
            });
        }
      });
  } else {
    // eslint-disable-next-line no-void
    void window.showInformationMessage('MetaEd has started 🎬');
  }

  await yieldToNextMacroTask();
}

/**
 * Extension lifecycle function invoked by VS Code to deactivate extension
 */
export function deactivate(): Promise<void> | undefined {
  telemetryLogger = null;
  if (!client) {
    return undefined;
  }
  return client.stop() as Promise<void>;
}
