// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { MetaEdConfiguration, SemVer } from '@edfi/metaed-core';

// The full server configuration needed for lint, build, and deploy
export type ServerMessage = {
  metaEdConfiguration: MetaEdConfiguration;
  dataStandardVersion: SemVer;
};
