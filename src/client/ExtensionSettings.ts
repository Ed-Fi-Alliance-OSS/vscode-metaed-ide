// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { workspace, WorkspaceConfiguration } from 'vscode';
import semver from 'semver';
import { SemVer } from '@edfi/metaed-core';

function getWorkspaceConfiguration(): WorkspaceConfiguration {
  return workspace.getConfiguration('metaed');
}

export function getOdsApiDeploymentDirectory(): string {
  return getWorkspaceConfiguration().get('odsApiDeploymentDirectory') ?? '';
}

export function suppressDeleteOnDeploy(): boolean {
  return getWorkspaceConfiguration().get('suppressDeleteOnDeploy') ?? false;
}

export function getTargetOdsApiMajorMinorVersion(): string {
  return getWorkspaceConfiguration().get('targetOdsApiVersion') ?? '';
}

export function getTargetOdsApiVersionSemver(): SemVer {
  const targetOdsApiSemVer: string = `${getTargetOdsApiMajorMinorVersion()}.0`;
  return (semver.coerce(targetOdsApiSemVer) || '').toString();
}

export function telemetryConsent(): string {
  return getWorkspaceConfiguration().get('telemetryConsent') ?? '';
}

export function acceptedLicense(): boolean {
  return getWorkspaceConfiguration().get('acceptedLicense') ?? false;
}

export function allianceMode(): boolean {
  return getWorkspaceConfiguration().get('allianceMode') ?? false;
}
