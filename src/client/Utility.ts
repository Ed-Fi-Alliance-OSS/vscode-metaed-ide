// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import path from 'node:path';
// eslint-disable-next-line import/no-unresolved
import { window } from 'vscode';

export const LICENSE_URL = ' https://www.ed-fi.org/getting-started/license-ed-fi-technology/';

/**
 * Awaiting on this function in a microtask ends the microtask queue and allows the next macro task to run.
 * See https://medium.com/@mmoshikoo/event-loop-in-nodejs-visualized-235867255e81 for a visual
 * explanation of the role of microtasks in the Node.js event loop
 *
 * For example, this is useful inside UI event listeners that then make a UI modification, as those event listeners
 * are microtasks (more specifically they are Promise callbacks), yet the UI change itself is a macro task. Yielding
 * gives the UI the opportunity to complete its UI behavior.
 */
export const yieldToNextMacroTask = async (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

/**
 * Post an error notification to the UI
 */
export async function showErrorNotification(message: string) {
  // eslint-disable-next-line no-void
  void window.showErrorMessage(message);
  await yieldToNextMacroTask();
}

/**
 * Post an info notification to the UI
 */
export async function showInfoNotification(message: string) {
  // eslint-disable-next-line no-void
  void window.showInformationMessage(message);
  await yieldToNextMacroTask();
}

/**
 * Returns the path to a particular npm package directory.
 */
export function nodeModulesPath(pathStartingWithPackageDirectory: string): string {
  return path.resolve(__dirname, '../../node_modules', pathStartingWithPackageDirectory);
}
