// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { URI } from 'vscode-uri';
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import type { Connection, Diagnostic } from 'vscode-languageserver/node';
import { executePipeline, newState } from '@edfi/metaed-core';
import type { State } from '@edfi/metaed-core';
import { defaultPlugins } from '@edfi/metaed-default-plugins';
import { ServerMessage } from '../model/ServerMessage';

// Virtual URI for validation errors that don't have a specific file location
const VALIDATION_ERRORS_VIRTUAL_URI = 'metaed:Validation Errors';

// Tracks which files have been marked with failures and sent to the client. Important for keeping the
// server in sync with the Problems window
let currentFilesWithFailures: string[] = [];

export async function lint(
  { metaEdConfiguration, dataStandardVersion }: ServerMessage,
  connection: Connection,
): Promise<void> {
  const state: State = {
    ...newState(),
    pipelineOptions: {
      runValidators: true,
      runEnhancers: true,
      runGenerators: false,
      stopOnValidationFailure: false,
    },
    metaEdConfiguration,
    metaEdPlugins: defaultPlugins(),
  };

  state.metaEd.dataStandardVersion = dataStandardVersion;

  const { validationFailure } = (await executePipeline(state)).state;

  const filesWithFailure: Map<string, Diagnostic[]> = new Map();

  // eslint-disable-next-line no-restricted-syntax
  for (const failure of validationFailure) {
    // Log validation failures that don't have file mapping for debugging
    if (failure.fileMap == null) {
      connection.console.log(
        `Validation failure without file mapping - ` +
          `Message: ${JSON.stringify(failure.message)}, ` +
          `Category: ${failure.category}, ` +
          `Full failure object: ${JSON.stringify(failure, null, 2)}`,
      );
    }

    // Use fileMap if available, otherwise fall back to a virtual URI for general failures
    const fileUri =
      failure.fileMap != null ? URI.file(failure.fileMap.fullPath) : URI.parse(VALIDATION_ERRORS_VIRTUAL_URI, true);

    if (!filesWithFailure.has(fileUri.toString())) {
      filesWithFailure.set(fileUri.toString(), []);
    }

    const tokenLength: number = failure.sourceMap && failure.sourceMap.tokenText ? failure.sourceMap.tokenText.length : 0;
    const adjustedLine: number = !failure.fileMap || failure.fileMap.lineNumber === 0 ? 0 : failure.fileMap.lineNumber - 1;
    const characterPosition: number = failure.sourceMap ? failure.sourceMap.column : 0;

    // Enhance message with additional context when file mapping is unavailable
    let diagnosticMessage = failure.message;
    if (failure.fileMap == null) {
      // Add any available identifying information to help trace the validator source
      const validatorInfo = (failure as any).validatorName || (failure as any).validator || (failure as any).type || '';
      if (validatorInfo) {
        diagnosticMessage = `[${validatorInfo}] ${failure.message}`;
      } else {
        diagnosticMessage = `[No file mapping] ${failure.message}`;
      }
    }

    const diagnostic: Diagnostic = {
      severity: failure.category === 'warning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
      range: {
        start: { line: adjustedLine, character: characterPosition },
        end: { line: adjustedLine, character: characterPosition + tokenLength },
      },
      message: diagnosticMessage,
      source: 'MetaEd',
    };

    const fileWithFailureDiagnostics = filesWithFailure.get(fileUri.toString());
    if (fileWithFailureDiagnostics != null) fileWithFailureDiagnostics.push(diagnostic);
  }

  // send failures
  connection.console.log(`${Date.now()}: Server is sending failures`);
  // eslint-disable-next-line no-restricted-syntax
  for (const [uri, diagnostics] of filesWithFailure) {
    connection.console.log(`${Date.now()}: Server sends failure for ${uri} to client`);
    await connection.sendDiagnostics({ uri, diagnostics });
  }

  // clear resolved failures
  const resolvedFailures = currentFilesWithFailures.filter((fileUri) => !filesWithFailure.has(fileUri));
  // eslint-disable-next-line no-restricted-syntax
  for (const uri of resolvedFailures) {
    await connection.sendDiagnostics({ uri, diagnostics: [] });
  }
  currentFilesWithFailures = Array.from(filesWithFailure.keys());
}
