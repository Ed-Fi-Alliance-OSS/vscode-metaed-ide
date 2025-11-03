// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
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
