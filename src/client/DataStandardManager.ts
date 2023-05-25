// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import path from 'node:path';
import { promisify } from 'node:util';
// eslint-disable-next-line import/no-unresolved
import { Extension, extensions, window, workspace } from 'vscode';
import chmodr from 'chmodr';
import semver from 'semver';
import * as R from 'ramda';
import { SemVer } from '@edfi/metaed-core';

export type SemVerRange = string;

// promise version of chmodr
const chmodrp = promisify(chmodr);

// keys are ODS/API versions, values are corresponding DS version ranges supported
const odsApiToDsVersionRange: Map<SemVer, SemVerRange> = new Map([
  ['3.0.0', '3.0.0'],
  ['3.1.0', '3.1.0'],
  ['3.1.1', '3.1.0'],
  ['3.2.0', '3.1.0'],
  ['3.3.0', '3.2.0'],
  ['3.4.0', '3.2.0-b'],
  ['5.0.0', '3.2.0-c'],
  ['5.1.0', '3.2.0-c'],
  ['5.2.0', '3.3.0-a'],
  ['5.3.0', '3.3.1-b'],
  ['6.0.0', '4.0.0-a'],
  ['6.1.0', '4.0.0'],
  ['7.0.0', '>=4.0.0'],
]);

/**
 * Finds the root directory path for the bundled Data Standard models.
 */
export const bundledDsRootPath: () => string = R.memoizeWith(R.identity, () => {
  const metaedExtension: Extension<void> | undefined = extensions.getExtension('Ed-FiAlliance.vscode-metaed-ide');
  if (metaedExtension == null) {
    // eslint-disable-next-line no-void
    void window.showErrorMessage('MetaEd hardcoded extension publisher.name is incorrect');
    return '';
  }

  return path.join(metaedExtension.extensionPath, 'node_modules', '@edfi');
});

function nodeModulesPath(moduleName: string) {
  return path.join(bundledDsRootPath(), moduleName);
}

/**
 * Returns a recommended bundled data model project directory for the given data standard version range
 */
export function dsVersionRangeToModelProjectDirectory(dsVersionRange: SemVerRange): string {
  let modelPath = '';

  switch (dsVersionRange) {
    case '3.0.0':
      modelPath = nodeModulesPath('ed-fi-model-3.0');
      break;
    case '3.1.0':
      modelPath = nodeModulesPath('ed-fi-model-3.1');
      break;
    case '3.2.0':
      modelPath = nodeModulesPath('ed-fi-model-3.2a');
      break;
    case '3.2.0-b':
      modelPath = nodeModulesPath('ed-fi-model-3.2b');
      break;
    case '3.2.0-c':
      modelPath = nodeModulesPath('ed-fi-model-3.2c');
      break;
    case '3.3.0-a':
      modelPath = nodeModulesPath('ed-fi-model-3.3a');
      break;
    case '3.3.1-b':
      modelPath = nodeModulesPath('ed-fi-model-3.3b');
      break;
    case '4.0.0-a':
      modelPath = nodeModulesPath('ed-fi-model-4.0a');
      break;
    case '4.0.0':
      modelPath = nodeModulesPath('ed-fi-model-4.0');
      break;
    case '>=4.0.0':
      modelPath = nodeModulesPath('ed-fi-model-5.0-pre.1');
      break;
    default:
      break;
  }

  return modelPath;
}

export type DsVersionAndOdsApiVersion = { dataStandardVersion: SemVerRange; odsApiVersion: SemVerRange };

/**
 * Returns the Data Standard version range supported by the given ODS/API version
 */
export function odsApiVersionSupportsRange(odsApiVersion: SemVerRange): SemVerRange {
  return odsApiToDsVersionRange.get(odsApiVersion) ?? '3.0.0';
}

/**
 * Returns true if the given ODS/API version supports the given Data Standard version
 */
export function odsApiVersionSupportsDsVersion({ dataStandardVersion, odsApiVersion }): boolean {
  return semver.satisfies(dataStandardVersion, odsApiVersionSupportsRange(odsApiVersion), { includePrerelease: true });
}

/**
 * Enforces read-only file permissions for bundled data standard projects in the workspace
 */
export async function ensureBundledDsReadOnly() {
  if (workspace.workspaceFolders == null) return;

  // eslint-disable-next-line no-restricted-syntax
  for (const workspaceFolder of workspace.workspaceFolders) {
    const folderPath = workspaceFolder.uri.fsPath;

    // set packaged data standard project files as read-only
    if (folderPath.includes(bundledDsRootPath())) {
      await chmodrp(folderPath, 0o444);
    }
  }
}
