// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { TelemetrySender, env, extensions } from 'vscode';
import bugsnag from '@bugsnag/js';

bugsnag.start({
  apiKey: 'BUGSNAGKEY',
  appVersion: extensions.getExtension('Ed-FiAlliance.vscode-metaed-ide')?.packageJSON?.version ?? 'unknown',
  user: {
    id: env.machineId,
  },
});

export const telemetrySender: TelemetrySender = {
  sendEventData(_eventName: string, _data?: Record<string, any> | undefined): void {
    // do nothing
  },
  sendErrorData(error: any, _data?: Record<string, any> | undefined): void {
    bugsnag.notify(error);
  },
};
