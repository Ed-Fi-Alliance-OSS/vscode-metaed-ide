// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { workspace, WorkspaceConfiguration } from 'vscode';
import semver from 'semver';
import { yieldToNextMacroTask } from './Utility';

function getWorkspaceConfiguration(): WorkspaceConfiguration {
  return workspace.getConfiguration('metaed');
}

export function getDataStandardProjectDirectory(): string {
  return getWorkspaceConfiguration().get('dataStandardProjectDirectory') ?? '';
}

export async function setDataStandardProjectDirectory(directory: string) {
  const result = await getWorkspaceConfiguration().update('dataStandardProjectDirectory', directory);
  await yieldToNextMacroTask();
  return result;
}

export function getOdsApiDeploymentDirectory(): string {
  return getWorkspaceConfiguration().get('odsApiDeploymentDirectory') ?? '';
}

export function suppressDeleteOnDeploy(): boolean {
  return getWorkspaceConfiguration().get('suppressDeleteOnDeploy') ?? false;
}

export function getTargetDsVersion(): string {
  return getWorkspaceConfiguration().get('targetDataStandardVersion') ?? '';
}

export function getTargetDsVersionSemver(): string {
  const targetDsVersion: string = getTargetDsVersion();
  return targetDsVersion === '' ? '6.1.0' : targetDsVersion;
}

export async function setTargetDsVersion(targetDsVersion: string) {
  const result = await getWorkspaceConfiguration().update('targetDataStandardVersion', targetDsVersion);
  await yieldToNextMacroTask();
  return result;
}

export function getTargetOdsApiVersion(): string {
  return getWorkspaceConfiguration().get('targetOdsApiVersion') ?? '';
}

export function getTargetOdsApiVersionSemver(): string {
  return (semver.coerce(getTargetOdsApiVersion()) || '').toString();
}

export async function setTargetOdsApiVersion(targetOdsApiVersion: string) {
  const result = await getWorkspaceConfiguration().update('targetOdsApiVersion', targetOdsApiVersion);
  await yieldToNextMacroTask();
  return result;
}

export function telemetryConsent(): string {
  return getWorkspaceConfiguration().get('telemetryConsent') ?? '';
}

export async function setTelemetryConsent(consent: string) {
  const result = await getWorkspaceConfiguration().update('telemetryConsent', consent);
  await yieldToNextMacroTask();
  return result;
}

export function acceptedLicense(): boolean {
  return getWorkspaceConfiguration().get('acceptedLicense') ?? false;
}

export async function setAcceptedLicense() {
  const result = await getWorkspaceConfiguration().update('acceptedLicense', true);
  await yieldToNextMacroTask();
  return result;
}

export function allianceMode(): boolean {
  return getWorkspaceConfiguration().get('allianceMode') ?? false;
}
