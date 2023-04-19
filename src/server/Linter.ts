// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import { URI } from 'vscode-uri';
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import type { Connection, Diagnostic } from 'vscode-languageserver/node';
import { executePipeline, newState } from '@edfi/metaed-core';
import type { State } from '@edfi/metaed-core';
import { ServerMessage } from '../model/ServerMessage';

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
  };

  state.metaEd.dataStandardVersion = dataStandardVersion;

  const { validationFailure } = (await executePipeline(state)).state;

  const filesWithFailure: Map<string, Diagnostic[]> = new Map();

  // eslint-disable-next-line no-restricted-syntax
  for (const failure of validationFailure) {
    if (failure.fileMap != null) {
      const fileUri = URI.file(failure.fileMap.fullPath);
      if (!filesWithFailure.has(fileUri.toString())) {
        filesWithFailure.set(fileUri.toString(), []);
      }

      const tokenLength: number = failure.sourceMap && failure.sourceMap.tokenText ? failure.sourceMap.tokenText.length : 0;
      const adjustedLine: number = !failure.fileMap || failure.fileMap.lineNumber === 0 ? 0 : failure.fileMap.lineNumber - 1;
      const characterPosition: number = failure.sourceMap ? failure.sourceMap.column : 0;

      const diagnostic: Diagnostic = {
        severity: failure.category === 'warning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
        range: {
          start: { line: adjustedLine, character: characterPosition },
          end: { line: adjustedLine, character: characterPosition + tokenLength },
        },
        message: failure.message,
        source: 'MetaEd',
      };

      const fileWithFailureDiagnostics = filesWithFailure.get(fileUri.toString());
      if (fileWithFailureDiagnostics != null) fileWithFailureDiagnostics.push(diagnostic);
    }
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
