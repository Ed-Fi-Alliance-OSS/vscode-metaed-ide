// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import { MetaEdConfiguration, SemVer } from '@edfi/metaed-core';

// The full server configuration needed for lint, build, and deploy
export type ServerMessage = {
  metaEdConfiguration: MetaEdConfiguration;
  dataStandardVersion: SemVer;
};
