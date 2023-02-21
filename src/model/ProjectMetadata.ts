// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.
import type { MetaEdProject } from '@edfi/metaed-core';

export interface ProjectMetadata extends MetaEdProject {
  projectPath: string;
  isExtensionProject: boolean;
}

export function newProjectMetadata(projectPath: string): ProjectMetadata {
  return {
    projectPath,
    projectName: '',
    projectVersion: '',
    namespaceName: '',
    isExtensionProject: false,
    projectExtension: '',
    description: '',
  };
}
