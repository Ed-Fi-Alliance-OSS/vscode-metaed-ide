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
} from 'vscode';
import path from 'path';
import debounce from 'p-debounce';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { AboutPanel } from './AboutPanel';
import {
  initializeWorkspaceFolders,
  InitializeWorkspaceFoldersResult,
  syncDsProjectDirectoryOnTargetDsChange,
  switchCoreDsProjectOnOdsApiChange,
  syncWorkspaceOnDsDirectoryOrDsChange,
} from './ManageConfiguration';
import { yieldToNextMacroTask } from './Utility';
import { acceptedLicense, allianceMode, getOdsApiDeploymentDirectory, suppressDeleteOnDeploy } from './ExtensionSettings';
import type { DeployParams } from '../server/DeployParams';
import { createMetaEdConfiguration } from './MetaEdConfigurationFactory';

let client: LanguageClient;
const acceptedLicenseDiagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection('acceptedLicense');

const sendLintCommandToServer: () => Promise<void> = debounce(async () => {
  // Only lint when agreement is accepted
  if (!acceptedLicense()) return;
  await client.sendNotification('metaed/lint');
}, 500);

/**
 * True if both the file part of a MetaEd project (associated with the MetaEd extension) and ends in .metaed
 */
function isDotMetaEdFile(document: TextDocument): boolean {
  return document?.languageId === 'metaed' && document.uri.path.endsWith('.metaed');
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
          // eslint-disable-next-line no-void
          void window.showErrorMessage('You must first accept the Ed-Fi License Agreement in Workspace settings.');
          await yieldToNextMacroTask();
          return;
        }

        const metaEdConfiguration = await createMetaEdConfiguration();
        await client.sendNotification('metaed/build', metaEdConfiguration);

        // eslint-disable-next-line no-void
        void window.showInformationMessage('Building MetaEd...');
        await yieldToNextMacroTask();
      })();
    }),
  );

  // Deploy command from user
  context.subscriptions.push(
    commands.registerCommand('metaed.deploy', () => {
      (async () => {
        if (!acceptedLicense()) {
          // eslint-disable-next-line no-void
          void window.showErrorMessage('You must first accept the Ed-Fi License Agreement in Workspace settings.');
          await yieldToNextMacroTask();
          return;
        }

        if (getOdsApiDeploymentDirectory() === '') {
          // eslint-disable-next-line no-void
          void window.showInformationMessage('To deploy, set Ods Api Deployment Directory in Workspace settings.');
          await yieldToNextMacroTask();
          return;
        }

        const metaEdConfiguration = await createMetaEdConfiguration();
        if (metaEdConfiguration == null) return;

        // Is there anything to deploy? (In allianceMode, core always gets deployed)
        if (!metaEdConfiguration.allianceMode && metaEdConfiguration.projects.length <= 1) {
          // eslint-disable-next-line no-void
          void window.showInformationMessage('No extension to deploy.');
          await yieldToNextMacroTask();
          return;
        }

        const deployParams: DeployParams = {
          metaEdConfiguration,
          deployCore: allianceMode(),
          suppressDelete: suppressDeleteOnDeploy(),
        };
        await client.sendNotification('metaed/deploy', deployParams);

        // eslint-disable-next-line no-void
        void window.showInformationMessage('Deploying MetaEd...');
        await yieldToNextMacroTask();
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

  // Show About panel command from user
  context.subscriptions.push(
    commands.registerCommand('metaed.about', () => {
      AboutPanel.createOrShow(context.extensionPath);
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
          // eslint-disable-next-line no-void
          void window.showInformationMessage(
            `MetaEd build success: Find results in 'MetaEdOutput' folder. You may need to refresh the VS Code file explorer.`,
          );
          await yieldToNextMacroTask();
        } else {
          // eslint-disable-next-line no-void
          void window.showInformationMessage('MetaEd build failure - see Problems window');
          await commands.executeCommand('workbench.action.problems.focus');
        }
      })();
    }),
  );

  // Listen for deployComplete message from server
  context.subscriptions.push(
    client.onNotification('metaed/deployComplete', (success: boolean) => {
      (async () => {
        if (success) {
          // eslint-disable-next-line no-void
          void window.showInformationMessage(
            `MetaEd deploy success: Find results under '${getOdsApiDeploymentDirectory()}' ODS/API folder.`,
          );
          await yieldToNextMacroTask();
        } else {
          // eslint-disable-next-line no-void
          void window.showInformationMessage(
            'MetaEd deploy failure - see Problems window and/or check ODS/API path in settings',
          );
          await commands.executeCommand('workbench.action.problems.focus');
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
    await client.sendNotification('metaed/lint');
  } else {
    acceptedLicenseDiagnosticCollection.set(Uri.parse('metaed:Ed-Fi License Needs Accepting', true), [
      new Diagnostic(
        new Range(new Position(0, 0), new Position(0, 0)),
        'Please accept the Ed-Fi License Agreement in Workspace settings',
      ),
    ]);
  }
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
  const serverModule = context.asAbsolutePath(path.join('dist', 'server', 'server.js'));
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

  const initializeResult: InitializeWorkspaceFoldersResult = await initializeWorkspaceFolders(client.outputChannel);
  if (initializeResult.restarting) {
    client.outputChannel.appendLine('MetaEd will restart');
    return;
  }

  switchCoreDsProjectOnOdsApiChange(client.outputChannel);
  await syncDsProjectDirectoryOnTargetDsChange(context, client.outputChannel);
  await syncWorkspaceOnDsDirectoryOrDsChange(context, client.outputChannel);

  await listenForAcceptedLicenseChange(context);
  await syncAcceptedLicenseDiagnostic();
  await yieldToNextMacroTask();

  client.outputChannel.appendLine('MetaEd has started 🎬');
  // eslint-disable-next-line no-void
  void window.showInformationMessage('MetaEd has started 🎬');
  await yieldToNextMacroTask();
}

/**
 * Extension lifecycle function invoked by VS Code to deactivate extension
 */
export function deactivate(): Promise<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop() as Promise<void>;
}
