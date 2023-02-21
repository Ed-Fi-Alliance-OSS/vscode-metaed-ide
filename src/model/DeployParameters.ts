// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import { ServerMessage } from './ServerMessage';

export type DeployParameters = {
  serverMessage: ServerMessage;
  deployCore: boolean;
  suppressDelete: boolean;
};
