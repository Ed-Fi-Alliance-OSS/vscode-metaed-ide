// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import fs from 'node:fs/promises';
import path from 'path';
import semver from 'semver';
import { deriveNamespaceFromProjectName } from '@edfi/metaed-core';

const PROJECT_SETTINGS_FILE_NAME = 'package.json';

export type ProjectMetadata = {
  projectName: string;
  projectVersion: string;
  projectDescription?: string;
};

/**
 * Returns the MetaEd project metadata from the package.json file of a MetaEd project, or null if the file either
 * does not exist or is not for a MetaEd project.
 */
export async function projectMetadataFromProjectJson(pathToProjectJson: string): Promise<ProjectMetadata | null> {
  try {
    const projectJsonFile: string = (await fs.readFile(pathToProjectJson)).toString();
    const projectJson = JSON.parse(projectJsonFile);
    if (projectJson.metaEdProject && projectJson.metaEdProject.projectName && projectJson.metaEdProject.projectVersion) {
      return projectJson.metaEdProject;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export interface MetaEdProjectMetadata {
  projectPath: string;
  invalidProject: boolean;
  invalidProjectReason: string;
  projectName: string;
  projectVersion: string;
  projectNamespace: string;
  isExtensionProject: boolean;
  projectExtension: string;
  projectDescription: string;
}

function newMetaEdProjectMetadata(projectPath: string): MetaEdProjectMetadata {
  return {
    projectPath,
    invalidProject: false,
    invalidProjectReason: '',
    projectName: '',
    projectVersion: '',
    projectNamespace: '',
    isExtensionProject: false,
    projectExtension: '',
    projectDescription: '',
  };
}

export function validProjectMetadata(metaEdProjectMetadata: MetaEdProjectMetadata[]): boolean {
  let hasInvalidProject = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const pm of metaEdProjectMetadata) {
    if (pm.invalidProject) {
      hasInvalidProject = true;
    }
  }
  if (hasInvalidProject) return false;

  return true;
}
export async function findMetaEdProjectMetadata(projectPaths: string[]): Promise<MetaEdProjectMetadata[]> {
  const result: MetaEdProjectMetadata[] = await Promise.all(
    projectPaths.map(async (projectPath: string) => {
      const projectJsonFilePath = path.join(projectPath, PROJECT_SETTINGS_FILE_NAME);
      const projectFileData: ProjectMetadata | null = await projectMetadataFromProjectJson(projectJsonFilePath);

      if (projectFileData == null) {
        return {
          ...newMetaEdProjectMetadata(projectPath),
          invalidProject: true,
          invalidProjectReason: 'must have both metaEdProject.projectName and metaEdProject.projectVersion definitions',
        };
      }

      const projectNamespace: string | null = deriveNamespaceFromProjectName(projectFileData.projectName);
      if (projectNamespace == null) {
        return {
          ...newMetaEdProjectMetadata(projectPath),
          invalidProject: true,
          invalidProjectReason:
            'metaEdProject.projectName definition must begin with an uppercase character. All other characters must be alphanumeric only.',
        };
      }

      const projectVersion = projectFileData.projectVersion || '';
      if (!semver.valid(projectVersion)) {
        return {
          ...newMetaEdProjectMetadata(projectPath),
          invalidProject: true,
          invalidProjectReason:
            'metaEdProject.projectVersion is not a valid version declaration. Version declarations must follow the semver.org standard.',
        };
      }

      return {
        ...newMetaEdProjectMetadata(projectPath),
        projectName: projectFileData.projectName,
        projectVersion,
        projectNamespace,
        isExtensionProject: projectNamespace !== 'EdFi',
        projectExtension: projectNamespace === 'EdFi' ? '' : 'EXTENSION',
      };
    }),
  );
  return result;
}
