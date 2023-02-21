// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import { InvalidProject } from './InvalidProject';
import { ProjectMetadata } from './ProjectMetadata';

export type WorkspaceProjects = {
  projectMetadatas: ProjectMetadata[];
  invalidProjects: InvalidProject[];
};
