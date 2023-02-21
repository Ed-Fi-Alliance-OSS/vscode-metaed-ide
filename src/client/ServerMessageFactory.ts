// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import path from 'node:path';
import type { OutputChannel } from 'vscode';
import { findDataStandardVersions, MetaEdConfiguration, newMetaEdConfiguration, SemVer } from '@edfi/metaed-core';
import { findMetaEdProjects } from './ProjectFinder';
import { getTargetOdsApiVersionSemver, allianceMode, getOdsApiDeploymentDirectory } from './ExtensionSettings';
import { WorkspaceProjects } from '../model/WorkspaceProjects';
import { ServerMessage } from '../model/ServerMessage';
import { showErrorNotification, showInfoNotification } from './Utility';
import {
  bundledDsRootPath,
  odsApiVersionSupportsDsVersion,
  dsVersionToModelProjectDirectory,
  odsApiVersionSupports,
} from './DataStandardManager';

type ServerMessageFactoryOptions = {
  showUiNotifications: boolean;
};

/**
 * Log error message to console and UI (if UI notifications are requested)
 */
async function notifyError(errorMessage: string, outputChannel: OutputChannel, showUiNotifications: boolean) {
  if (showUiNotifications) {
    await showErrorNotification(errorMessage);
  }
  outputChannel.appendLine(errorMessage);
}

/**
 * Log info message to console and UI (if UI notifications are requested)
 */
async function notifyInfo(infoMessage: string, outputChannel: OutputChannel, showUiNotifications: boolean) {
  if (showUiNotifications) {
    await showInfoNotification(infoMessage);
  }
  outputChannel.appendLine(infoMessage);
}

/**
 * Creates a ServerMessage for lint/build/deploy from the VS Code workspace and settings
 */
export async function createServerMessage(
  outputChannel: OutputChannel,
  { showUiNotifications }: ServerMessageFactoryOptions = { showUiNotifications: true },
): Promise<ServerMessage | undefined> {
  const { projectMetadatas, invalidProjects }: WorkspaceProjects = await findMetaEdProjects();

  if (projectMetadatas.length === 0) {
    // There are no MetaEd projects in the workspace
    await notifyError(
      `MetaEd requires a Data Standard project in the workspace. Bundled versions are at ${bundledDsRootPath()}`,
      outputChannel,
      showUiNotifications,
    );
    return undefined;
  }

  if (invalidProjects.length !== 0) {
    // There are non-MetaEd projects in the workspace
    await notifyInfo(
      'There are non-MetaEd projects in the workspace. They will be ignored',
      outputChannel,
      showUiNotifications,
    );
  }

  // Find all the data standard projects and their versions
  const dataStandardVersionsInWorkspace: SemVer[] = findDataStandardVersions(projectMetadatas);

  if (dataStandardVersionsInWorkspace.length !== 1) {
    // MetaEd requires exactly one data standard project
    await notifyError(
      `MetaEd requires a single Data Standard project in the workspace. Bundled versions are at ${bundledDsRootPath()}`,
      outputChannel,
      showUiNotifications,
    );
    return undefined;
  }

  const odsApiVersion: SemVer = getTargetOdsApiVersionSemver();
  const [dataStandardVersion] = dataStandardVersionsInWorkspace;

  if (!odsApiVersionSupportsDsVersion({ dataStandardVersion, odsApiVersion })) {
    // Selected DS version and ODS/API version are not compatible
    await notifyError(
      `ODS/API version ${odsApiVersion} in settings requires data standard project at ${dsVersionToModelProjectDirectory(
        odsApiVersionSupports(odsApiVersion),
      )}`,
      outputChannel,
      showUiNotifications,
    );
    return undefined;
  }

  const lastProjectPath = projectMetadatas[projectMetadatas.length - 1].projectPath;

  const metaEdConfiguration: MetaEdConfiguration = {
    ...newMetaEdConfiguration(),
    defaultPluginTechVersion: getTargetOdsApiVersionSemver(),
    allianceMode: allianceMode(),
    artifactDirectory: path.join(lastProjectPath, 'MetaEdOutput'),
    deployDirectory: getOdsApiDeploymentDirectory(),
  };

  projectMetadatas.forEach((projectMetadata) => {
    metaEdConfiguration.projects.push({
      namespaceName: projectMetadata.namespaceName,
      projectName: projectMetadata.projectName,
      projectVersion: projectMetadata.projectVersion,
      projectExtension: projectMetadata.projectExtension,
      description: projectMetadata.description,
    });
    metaEdConfiguration.projectPaths.push(projectMetadata.projectPath);
  });

  return { metaEdConfiguration, dataStandardVersion };
}
