// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

/* eslint-disable no-continue */
// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import fs from 'node:fs/promises';
import path from 'path';
import semver from 'semver';

import { deriveNamespaceFromProjectName } from '@edfi/metaed-core';
import { ProjectMetadata, newProjectMetadata } from '../model/ProjectMetadata';
import { ProjectJsonFields } from '../model/ProjectJsonFields';
import { WorkspaceProjects } from '../model/WorkspaceProjects';
import { InvalidProject } from '../model/InvalidProject';

/**
 * Returns the MetaEd project metadata from the package.json file of a MetaEd project, or null if the file either
 * does not exist or is not for a MetaEd project.
 */
async function projectMetadataFromProjectJson(projectJsonFilePath: string): Promise<ProjectJsonFields | null> {
  try {
    const projectJsonFile: string = (await fs.readFile(projectJsonFilePath)).toString();
    const projectJson = JSON.parse(projectJsonFile);
    if (projectJson.metaEdProject && projectJson.metaEdProject.projectName && projectJson.metaEdProject.projectVersion) {
      return projectJson.metaEdProject;
    }
    return null;
  } catch (err) {
    return null;
  }
}

const PROJECT_SETTINGS_FILE_NAME = 'package.json';

/**
 * Checks that the workspace folder paths point to MetaEd projects on the file system.
 * Returns metadata for MetaEd projects, and information on non-MetaEd project folders.
 *
 * Valid and invalid folder information are returned separately, each of which are in workspace order
 */
export async function findMetaEdProjects(): Promise<WorkspaceProjects> {
  const folderPaths: string[] = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders.map((workspaceFolder) => workspaceFolder.uri.fsPath)
    : [];

  const projectMetadatas: ProjectMetadata[] = [];
  const invalidProjects: InvalidProject[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const folderPath of folderPaths) {
    const projectJsonFilePath = path.join(folderPath, PROJECT_SETTINGS_FILE_NAME);
    const projectJsonMetadata: ProjectJsonFields | null = await projectMetadataFromProjectJson(projectJsonFilePath);

    if (projectJsonMetadata == null) {
      invalidProjects.push({
        folderPath,
        reasonInvalid:
          'Workspace folder does not have a package.json file with both metaEdProject.projectName and metaEdProject.projectVersion definitions.',
      });
      continue;
    }

    const namespaceName: string | null = deriveNamespaceFromProjectName(projectJsonMetadata.projectName);
    if (namespaceName == null) {
      invalidProjects.push({
        folderPath,
        reasonInvalid:
          'metaEdProject.projectName definition must begin with an uppercase character. All other characters must be alphanumeric only.',
      });
      continue;
    }

    const projectVersion = projectJsonMetadata.projectVersion || '';
    if (!semver.valid(projectVersion)) {
      invalidProjects.push({
        folderPath,
        reasonInvalid:
          'metaEdProject.projectVersion is not a valid version declaration. Version declarations must follow the semver.org standard.',
      });
      continue;
    }

    projectMetadatas.push({
      ...newProjectMetadata(folderPath),
      projectName: projectJsonMetadata.projectName,
      projectVersion,
      namespaceName,
      isExtensionProject: namespaceName !== 'EdFi',
      projectExtension: namespaceName === 'EdFi' ? '' : 'EXTENSION',
    });
  }

  return { projectMetadatas, invalidProjects };
}
