// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import { MetaEdConfiguration } from '@edfi/metaed-core';

export type DeployParams = {
  metaEdConfiguration: MetaEdConfiguration;
  deployCore: boolean;
  suppressDelete: boolean;
};
