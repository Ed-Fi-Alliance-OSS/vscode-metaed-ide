// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

/* eslint-disable import/no-unresolved */
import { workspace } from 'vscode';
import * as R from 'ramda';
import path from 'path';
import { MetaEdConfiguration, newMetaEdConfiguration } from '@edfi/metaed-core';
import { findMetaEdProjectMetadataForClient } from './Projects';
import { MetaEdProjectMetadata, validProjectMetadata } from '../common/Projects';
import { getTargetOdsApiVersionSemver, allianceMode, getOdsApiDeploymentDirectory } from './ExtensionSettings';

/**
 * Creates a MetaEdConfiguration for build/deploy from the VS Code workspace and settings
 */
export async function createMetaEdConfiguration(): Promise<MetaEdConfiguration | undefined> {
  const metaEdProjectMetadata: MetaEdProjectMetadata[] = await findMetaEdProjectMetadataForClient();
  if (!validProjectMetadata(metaEdProjectMetadata)) return undefined;

  const lastProjectPath = workspace.workspaceFolders ? R.last(workspace.workspaceFolders).uri.fsPath : '';

  const metaEdConfiguration: MetaEdConfiguration = {
    ...newMetaEdConfiguration(),
    defaultPluginTechVersion: getTargetOdsApiVersionSemver(),
    allianceMode: allianceMode(),
    artifactDirectory: path.join(lastProjectPath, 'MetaEdOutput'),
    deployDirectory: getOdsApiDeploymentDirectory(),
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
