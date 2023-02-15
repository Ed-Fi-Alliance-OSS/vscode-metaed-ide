// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import { URI } from 'vscode-uri';
import {
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
} from 'vscode-languageserver/node';
import { State, MetaEdConfiguration, executePipeline, newState, newMetaEdConfiguration } from '@edfi/metaed-core';
import { runDeployTasks } from '@edfi/metaed-odsapi-deploy';
import { MetaEdProjectMetadata, validProjectMetadata, findMetaEdProjectMetadata } from '../common/Projects';
import { DeployParams } from './DeployParams';

export async function findMetaEdProjectMetadataForServer(workspaceFolders: string[]): Promise<MetaEdProjectMetadata[]> {
  return findMetaEdProjectMetadata(workspaceFolders.map((folderUri) => URI.parse(folderUri).fsPath));
}

const connection = createConnection(ProposedFeatures.all);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

const workspaceFolders: Set<string> = new Set();
let currentFilesWithFailures: string[] = [];

async function createMetaEdConfiguration(
  metaEdProjectMetadata: MetaEdProjectMetadata[],
): Promise<MetaEdConfiguration | undefined> {
  if (!validProjectMetadata(metaEdProjectMetadata)) return undefined;

  const metaEdConfiguration: MetaEdConfiguration = {
    ...newMetaEdConfiguration(),
    defaultPluginTechVersion: '6.1.0',
    allianceMode: false,
  };

  metaEdProjectMetadata.forEach((pm) => {
    metaEdConfiguration.projects.push({
      namespaceName: pm.projectNamespace,
      projectName: pm.projectName,
      projectVersion: pm.projectVersion,
      projectExtension: pm.projectExtension,
      description: pm.projectDescription,
    });
    metaEdConfiguration.projectPaths.push(pm.projectPath);
  });

  return metaEdConfiguration;
}

async function validateFiles(): Promise<void> {
  connection.console.log(`${Date.now()}: Server is running MetaEd to validate files`);
  const metaEdProjectMetadata: MetaEdProjectMetadata[] = await findMetaEdProjectMetadataForServer(
    Array.from(workspaceFolders),
  );
  const metaEdConfiguration: MetaEdConfiguration | undefined = await createMetaEdConfiguration(metaEdProjectMetadata);
  if (metaEdConfiguration == null) return;

  const state: State = {
    ...newState(),
    pipelineOptions: {
      runValidators: true,
      runEnhancers: true,
      runGenerators: false,
      stopOnValidationFailure: false,
    },
    metaEdConfiguration,
  };
  state.metaEd.dataStandardVersion = '4.0.0';

  const { validationFailure } = (await executePipeline(state)).state;

  const filesWithFailure: Map<string, Diagnostic[]> = new Map();

  // eslint-disable-next-line no-restricted-syntax
  for (const failure of validationFailure) {
    if (failure.fileMap != null) {
      const fileUri = URI.file(failure.fileMap.fullPath);
      if (!filesWithFailure.has(fileUri.toString())) {
        filesWithFailure.set(fileUri.toString(), []);
      }

      const tokenLength: number = failure.sourceMap && failure.sourceMap.tokenText ? failure.sourceMap.tokenText.length : 0;
      const adjustedLine: number = !failure.fileMap || failure.fileMap.lineNumber === 0 ? 0 : failure.fileMap.lineNumber - 1;
      const characterPosition: number = failure.sourceMap ? failure.sourceMap.column : 0;

      const diagnostic: Diagnostic = {
        severity: failure.category === 'warning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
        range: {
          start: { line: adjustedLine, character: characterPosition },
          end: { line: adjustedLine, character: characterPosition + tokenLength },
        },
        message: failure.message,
        source: 'MetaEd',
      };

      const fileWithFailureDiagnostics = filesWithFailure.get(fileUri.toString());
      if (fileWithFailureDiagnostics != null) fileWithFailureDiagnostics.push(diagnostic);
    }
  }

  // send failures
  connection.console.log(`${Date.now()}: Server is sending failures`);
  // eslint-disable-next-line no-restricted-syntax
  for (const [uri, diagnostics] of filesWithFailure) {
    connection.console.log(`${Date.now()}: Server sends failure for ${uri} to client`);
    await connection.sendDiagnostics({ uri, diagnostics });
  }

  // clear resolved failures
  const resolvedFailures = currentFilesWithFailures.filter((fileUri) => !filesWithFailure.has(fileUri));
  // eslint-disable-next-line no-restricted-syntax
  for (const uri of resolvedFailures) {
    await connection.sendDiagnostics({ uri, diagnostics: [] });
  }
  currentFilesWithFailures = Array.from(filesWithFailure.keys());
}

type BuildResult = { state: State; failure: boolean };

/**
 * Set up and call the metaed-core build process
 * @returns true if the build was successful
 */
async function build(metaEdConfiguration: MetaEdConfiguration): Promise<boolean> {
  const state: State = {
    ...newState(),
    pipelineOptions: {
      runValidators: true,
      runEnhancers: true,
      runGenerators: true,
      stopOnValidationFailure: true,
    },
    metaEdConfiguration,
  };
  state.metaEd.dataStandardVersion = '4.0.0';

  const result: BuildResult = await executePipeline(state);
  return !result.failure;
}

/**
 * Set up and call the metaed-odsapi-deploy build process
 * @returns true if the deploy was successful
 */
async function deploy({ metaEdConfiguration, deployCore, suppressDelete }: DeployParams): Promise<boolean> {
  return runDeployTasks(metaEdConfiguration, deployCore, suppressDelete);
}

connection.onNotification('metaed/build', (metaEdConfiguration: MetaEdConfiguration) => {
  (async () => {
    connection.console.log(`${Date.now()}: Server received build command from client`);
    const success: boolean = await build(metaEdConfiguration);

    connection.console.log(`${Date.now()}: Server sending build complete notification to client`);
    await connection.sendNotification('metaed/buildComplete', success);
  })();
});

connection.onNotification('metaed/deploy', (deployParams: DeployParams) => {
  (async () => {
    connection.console.log(`${Date.now()}: Server received deploy command from client`);
    const buildSuccess: boolean = await build(deployParams.metaEdConfiguration);

    connection.console.log(`${Date.now()}: Server sending build complete notification to client`);
    await connection.sendNotification('metaed/buildComplete', buildSuccess);

    const deploySuccess: boolean = await deploy(deployParams);

    connection.console.log(`${Date.now()}: Server sending deploy complete notification to client`);
    await connection.sendNotification('metaed/deployComplete', deploySuccess);
  })();
});

connection.onInitialize((params: InitializeParams) => {
  connection.console.log(`${Date.now()}: Server onInitialize (singular)`);
  const { capabilities } = params;

  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);

  return {
    capabilities: {
      workspace: {
        workspaceFolders: {
          supported: true,
          changeNotifications: true,
        },
      },
    },
  };
});

connection.onInitialized(() => {
  connection.console.log(`${Date.now()}: Server onInitialized (plural)`);
  (async () => {
    if (hasConfigurationCapability) {
      // Register for all configuration changes.
      await connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
      connection.workspace.onDidChangeWorkspaceFolders((event) => {
        connection.console.log(`${Date.now()}: Workspace folder change event received.`);
        event.removed.forEach((workspaceFolder) => {
          workspaceFolders.delete(workspaceFolder.uri);
        });
        event.added.forEach((workspaceFolder) => {
          workspaceFolders.add(workspaceFolder.uri);
        });
      });
      const currentWorkspaceFolders = await connection.workspace.getWorkspaceFolders();
      if (currentWorkspaceFolders != null) {
        currentWorkspaceFolders.forEach((workspaceFolder) => {
          workspaceFolders.add(workspaceFolder.uri);
        });
      }
    }
  })();
});

connection.onNotification('metaed/lint', () => {
  (async () => {
    connection.console.log(`${Date.now()}: Server received lint command from client`);
    await validateFiles();
  })();
});

// Make connection listen
connection.listen();
