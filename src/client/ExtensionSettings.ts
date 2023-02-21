// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { workspace, WorkspaceConfiguration } from 'vscode';
import semver from 'semver';

function getWorkspaceConfiguration(): WorkspaceConfiguration {
  return workspace.getConfiguration('metaed');
}

export function getOdsApiDeploymentDirectory(): string {
  return getWorkspaceConfiguration().get('odsApiDeploymentDirectory') ?? '';
}

export function suppressDeleteOnDeploy(): boolean {
  return getWorkspaceConfiguration().get('suppressDeleteOnDeploy') ?? false;
}

export function getTargetOdsApiVersion(): string {
  return getWorkspaceConfiguration().get('targetOdsApiVersion') ?? '';
}

export function getTargetOdsApiVersionSemver(): string {
  return (semver.coerce(getTargetOdsApiVersion()) || '').toString();
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
