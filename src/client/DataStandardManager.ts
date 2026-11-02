// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import path from 'node:path';
import { promisify } from 'node:util';
// eslint-disable-next-line import/no-unresolved
import { Extension, extensions, window, workspace } from 'vscode';
import chmodr from 'chmodr';
import semver from 'semver';
import { SemVer } from '@edfi/metaed-core';

export type SemVerRange = string;

// promise version of chmodr
const chmodrp = promisify(chmodr);

type DataStandardCompatibility = { range: SemVerRange; recommendedModel: string };

const defaultCompatibility: DataStandardCompatibility = { range: '4.0.0', recommendedModel: 'ed-fi-model-4.0' };

// Keep each supported range and its recommended bundled model together.
const odsApiCompatibility: Map<SemVer, DataStandardCompatibility> = new Map([
  ['6.1.0', defaultCompatibility],
  ['6.2.0', defaultCompatibility],
  ['7.1.0', { range: '>=4.0.0', recommendedModel: 'ed-fi-model-6.1' }],
  ['7.2.0', { range: '>=4.0.0', recommendedModel: 'ed-fi-model-6.1' }],
  ['7.3.0', { range: '>=4.0.0', recommendedModel: 'ed-fi-model-6.1' }],
  ['8.1.0', { range: '>=5.2.0', recommendedModel: 'ed-fi-model-6.1' }],
]);

let cachedBundledDsRootPath: string | undefined;
let extensionLookupErrorReported = false;

/**
 * Finds the root directory path for the bundled Data Standard models.
 */
export function bundledDsRootPath(): string | undefined {
  if (cachedBundledDsRootPath !== undefined) {
    return cachedBundledDsRootPath;
  }

  const metaedExtension: Extension<void> | undefined = extensions.getExtension('Ed-FiAlliance.vscode-metaed-ide');
  if (metaedExtension == null) {
    if (!extensionLookupErrorReported) {
      extensionLookupErrorReported = true;
      // eslint-disable-next-line no-void
      void window.showErrorMessage('MetaEd could not locate its extension installation and bundled Data Standard models.');
    }
    return undefined;
  }

  cachedBundledDsRootPath = path.join(metaedExtension.extensionPath, 'node_modules', '@edfi');
  return cachedBundledDsRootPath;
}

/**
 * Returns a recommended bundled data model project directory for the given Ed-Fi API version
 */
export function odsApiVersionToModelProjectDirectory(odsApiVersion: SemVerRange): string | undefined {
  const rootPath = bundledDsRootPath();
  if (rootPath === undefined) return undefined;
  const { recommendedModel } = odsApiCompatibility.get(odsApiVersion) ?? defaultCompatibility;
  return path.join(rootPath, recommendedModel);
}

export type DsVersionAndOdsApiVersion = { dataStandardVersion: SemVerRange; odsApiVersion: SemVerRange };

/**
 * Returns the Data Standard version range supported by the given ODS/API version
 */
export function odsApiVersionSupportsRange(odsApiVersion: SemVerRange): SemVerRange {
  return (odsApiCompatibility.get(odsApiVersion) ?? defaultCompatibility).range;
}

/**
 * Returns true if the given ODS/API version supports the given Data Standard version
 */
export function odsApiVersionSupportsDsVersion({ dataStandardVersion, odsApiVersion }: DsVersionAndOdsApiVersion): boolean {
  return semver.satisfies(dataStandardVersion, odsApiVersionSupportsRange(odsApiVersion), { includePrerelease: true });
}

function isWithinBundledDsRoot(folderPath: string, rootPath: string): boolean {
  const relativePath = path.relative(rootPath, folderPath);
  return relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath);
}

/**
 * Enforces read-only file permissions for bundled data standard projects in the workspace
 */
export async function ensureBundledDsReadOnly() {
  if (workspace.workspaceFolders == null) return;
  const rootPath = bundledDsRootPath();
  if (rootPath === undefined) return;

  // eslint-disable-next-line no-restricted-syntax
  for (const workspaceFolder of workspace.workspaceFolders) {
    const folderPath = workspaceFolder.uri.fsPath;

    // set packaged data standard project files as read-only
    if (isWithinBundledDsRoot(folderPath, rootPath)) {
      await chmodrp(folderPath, 0o444);
    }
  }
}

/**
 * Returns value indicating whether bundled data standard project is in workspace
 */
export function isBundledDataStandardProjectInWorkspace(): boolean {
  if (workspace.workspaceFolders == null) return false;
  const rootPath = bundledDsRootPath();
  if (rootPath === undefined) return false;

  // eslint-disable-next-line no-restricted-syntax
  for (const workspaceFolder of workspace.workspaceFolders) {
    const folderPath = workspaceFolder.uri.fsPath;

    if (isWithinBundledDsRoot(folderPath, rootPath)) {
      return true;
    }
  }

  return false;
}
