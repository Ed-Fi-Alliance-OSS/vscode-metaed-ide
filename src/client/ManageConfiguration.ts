// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import fs from 'node:fs';
import { promisify } from 'node:util';
// eslint-disable-next-line import/no-unresolved
import { ConfigurationChangeEvent, OutputChannel, Uri, workspace, window, ExtensionContext } from 'vscode';
import * as path from 'path';
import chmodr from 'chmodr';
import {
  setDataStandardProjectDirectory,
  getTargetDsVersion,
  setTargetDsVersion,
  getTargetOdsApiVersion,
  setTargetOdsApiVersion,
  getDataStandardProjectDirectory,
  allianceMode,
} from './ExtensionSettings';
import { nodeModulesPath, yieldToNextMacroTask } from './Utility';
import { ProjectMetadata, projectMetadataFromProjectJson } from '../common/Projects';

// promise version of chmodr
const chmodrp = promisify(chmodr);

// The default DS model path for this version of MetaEd
const DEFAULT_MODEL_PATH = nodeModulesPath('@edfi/ed-fi-model-4.0');

export type InitializeWorkspaceFoldersResult = { restarting: boolean };

// keys are ODS/API versions, values are corresponding DS versions supported
const odsApiToDsVersion: Map<string, string> = new Map([
  ['3.0.0', '3.0.0'],
  ['3.1.0', '3.1.0'],
  ['3.1.1', '3.1.0'],
  ['3.2.0', '3.1.0'],
  ['3.3.0', '3.2.0'],
  ['3.4.0', '3.2.0-b'],
  ['5.0.0', '3.2.0-c'],
  ['5.1.0', '3.2.0-c'],
  ['5.2.0', '3.3.0-a'],
  ['5.3.0', '3.3.1-b'],
  ['6.0.0', '4.0.0-a'],
  ['6.1.0', '4.0.0'],
]);

/**
 * Updates workspace folder with the given DS model. Also enforces read-only permissions.
 *
 * @param name The VS Code name for the workspace folder
 * @param uri The file URI for the folder
 */
async function updateDsWorkspaceFolder(name: string, modelPath: string) {
  const folderUri: Uri = Uri.file(modelPath);

  // set packaged data standard project files as read-only
  if (modelPath.includes('node_modules')) {
    await chmodrp(modelPath, 0o444);
  }

  // If no folders, add. If one folder, replace. If multiple folders, replace first.
  const deleteCount = workspace.workspaceFolders == null || workspace.workspaceFolders.length === 0 ? 0 : 1;
  workspace.updateWorkspaceFolders(0, deleteCount, {
    name,
    uri: folderUri,
  });
}

function dsVersionToModelPath(dsVersion: string): { modelPath: string } {
  let modelPath = DEFAULT_MODEL_PATH;

  switch (dsVersion) {
    case '3.0.0':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-3.0');
      break;
    case '3.1.0':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-3.1');
      break;
    case '3.2.0':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-3.2a');
      break;
    case '3.2.0-b':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-3.2b');
      break;
    case '3.2.0-c':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-3.2c');
      break;
    case '3.3.0-a':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-3.3a');
      break;
    case '3.3.1-b':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-3.3b');
      break;
    case '4.0.0-a':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-4.0a');
      break;
    case '4.0.0':
      modelPath = nodeModulesPath('@edfi/ed-fi-model-4.0');
      break;
    default:
      // Take the defaults
      break;
  }

  return { modelPath };
}

// Modifies data standard project directory in settings to be in sync with DS settings.
async function syncDataStandardProjectDirectoryToDsVersion(logOutputChannel: OutputChannel) {
  try {
    await yieldToNextMacroTask();
    const { modelPath } = dsVersionToModelPath(getTargetDsVersion());
    await setDataStandardProjectDirectory(modelPath);
  } catch (e) {
    logOutputChannel.appendLine(`Exception: ${e}`);
  } finally {
    await yieldToNextMacroTask();
  }
}

/**
 * Returns the model name for the data standard project at the given path, or null if it is not a path to a
 * data standard project.
 */
async function modelNameForDataStandardProjectAt(modelPath: string): Promise<string | null> {
  const projectMetadata: ProjectMetadata | null = await projectMetadataFromProjectJson(path.join(modelPath, 'package.json'));
  if (projectMetadata == null) return null;

  // Use the final directory name of the path as the model name
  return path.basename(modelPath);
}

// Modifies workspace to be in sync with the data standard project directory in settings. Will force a VS Code restart.
async function syncWorkspaceToDataStandardProjectDirectory(logOutputChannel: OutputChannel) {
  try {
    await yieldToNextMacroTask();
    const modelPath: string = getDataStandardProjectDirectory();

    // Unless in Alliance mode, users can only reference bundled DS projects
    if (!modelPath.includes('node_modules') && !allianceMode()) return;

    const modelName: string | null = await modelNameForDataStandardProjectAt(modelPath);

    // A null modelName means this wasn't a valid path, so do nothing
    if (modelName == null) return;

    // eslint-disable-next-line no-void
    void window.showInformationMessage(
      'MetaEd is updating the workspace Data Standard project. Please wait for restart message.',
    );
    await yieldToNextMacroTask();

    await updateDsWorkspaceFolder(modelName, modelPath);
  } catch (e) {
    logOutputChannel.appendLine(`Exception: ${e}`);
  } finally {
    await yieldToNextMacroTask();
  }
}

/**
 * Subscribe to targetDataStandardVersion settings changes, triggering data standard project directory change
 */
export async function syncDsProjectDirectoryOnTargetDsChange(context: ExtensionContext, logOutputChannel: OutputChannel) {
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async (event: ConfigurationChangeEvent) => {
      await yieldToNextMacroTask();
      if (!event.affectsConfiguration('metaed.targetDataStandardVersion')) return;
      logOutputChannel.appendLine('targetDataStandardVersion handled by syncDsProjectDirectoryOnTargetDsChange');

      await yieldToNextMacroTask();
      // Extra yield to allow an onDidChangeConfiguration for targetOdsApiVersion to settle
      await yieldToNextMacroTask();
      await syncDataStandardProjectDirectoryToDsVersion(logOutputChannel);
      await yieldToNextMacroTask();
    }),
  );
}

/**
 *  Subscribe to dataStandardProjectDirectory and targetDataStandardVersion settings changes, triggering workspace change
 */
export async function syncWorkspaceOnDsDirectoryOrDsChange(context: ExtensionContext, logOutputChannel: OutputChannel) {
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async (event: ConfigurationChangeEvent) => {
      await yieldToNextMacroTask();
      if (!event.affectsConfiguration('metaed.dataStandardProjectDirectory')) return;
      logOutputChannel.appendLine('dataStandardProjectDirectory handled by syncWorkspaceOnDsDirectoryOrDsChange');

      await yieldToNextMacroTask();
      // Extra yield to allow an onDidChangeConfiguration for targetOdsApiVersion to settle
      await yieldToNextMacroTask();
      // Extra yield to allow an onDidChangeConfiguration for targetDataStandardVersion to settle
      await yieldToNextMacroTask();
      // Extra yields for good measure
      await yieldToNextMacroTask();
      await yieldToNextMacroTask();
      await syncWorkspaceToDataStandardProjectDirectory(logOutputChannel);
    }),
  );
}

/**
 * Updates MetaEd settings and VS Code workspace to target ODS/API 6.x (the current default)
 */
async function setCoreToSixDotX(): Promise<InitializeWorkspaceFoldersResult> {
  const folderName = 'Ed-Fi-Model 4.0';
  const modelPath = nodeModulesPath('@edfi/ed-fi-model-4.0');

  if (workspace.workspaceFolders == null) {
    // eslint-disable-next-line no-void
    void window.showInformationMessage('MetaEd is modifying the workspace. Please wait for restart message.');
    await yieldToNextMacroTask();
    await updateDsWorkspaceFolder(folderName, modelPath);
    return { restarting: true };
  }

  // Intentionally not using `await` on the next line, as it causes unexpected behavior when trying to use MetaEd commands
  // eslint-disable-next-line no-void
  void window.showInformationMessage('MetaEd is switching Data Standard projects. Please wait for restart message.');
  await yieldToNextMacroTask();

  await updateDsWorkspaceFolder(folderName, modelPath);

  await yieldToNextMacroTask();

  await setDataStandardProjectDirectory(modelPath);
  await setTargetDsVersion('4.0.0');
  await setTargetOdsApiVersion('6.1.0');

  await yieldToNextMacroTask();
  return { restarting: false };
}

export function switchCoreDsProjectOnOdsApiChange(logOutputChannel: OutputChannel) {
  workspace.onDidChangeConfiguration(async (event: ConfigurationChangeEvent) => {
    try {
      if (!event.affectsConfiguration('metaed.targetOdsApiVersion')) return;
      logOutputChannel.appendLine('targetOdsApiVersion handled by switchCoreDsProjectOnOdsApiChange');
      await yieldToNextMacroTask();

      const newTargetOdsApiVersion: string = getTargetOdsApiVersion();
      const newTargetDsVersion: string | undefined = odsApiToDsVersion.get(newTargetOdsApiVersion);
      if (newTargetDsVersion != null) {
        await setTargetDsVersion(newTargetDsVersion);
        await yieldToNextMacroTask();
      }
    } catch (e) {
      logOutputChannel.appendLine(`Exception: ${e}`);
    }
  });
}

/**
 * Initialize package settings if the current ones are invalid
 */
export async function initializeWorkspaceFolders(
  logOutputChannel: OutputChannel,
): Promise<InitializeWorkspaceFoldersResult> {
  // If there are no MetaEd settings for DS, set defaults and load default DS workspace
  if (
    getTargetDsVersion() === '' ||
    getDataStandardProjectDirectory() === '' ||
    !fs.existsSync(path.resolve(getDataStandardProjectDirectory()))
  ) {
    return setCoreToSixDotX();
  }

  const x = workspace;

  // If a user closed the DS workspace, recover it
  if (x.workspaceFolders?.length === 0) {
    // eslint-disable-next-line no-void
    void window.showInformationMessage('MetaEd is modifying the workspace. Please wait for restart message.');
    await syncDataStandardProjectDirectoryToDsVersion(logOutputChannel);
    return { restarting: true };
  }

  return { restarting: false };
}
