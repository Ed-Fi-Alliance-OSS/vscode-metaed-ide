// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

// eslint-disable-next-line import/no-unresolved
import { Extension, extensions, window } from 'vscode';
import * as R from 'ramda';
import path from 'path';

export const LICENSE_URL = ' https://www.ed-fi.org/getting-started/license-ed-fi-technology/';

/**
 * Finds the directory path for the installed vscode-metaed extension. Used to access the bundled
 * Data Standard models.
 */
export const installedExtensionPath: () => string = R.memoizeWith(R.identity, () => {
  // TODO: Change publisher name from prototype's name
  const metaedExtension: Extension<void> | undefined = extensions.getExtension('edfi-test.metaed');
  if (metaedExtension == null) {
    // eslint-disable-next-line no-void
    void window.showErrorMessage('MetaEd hardcoded extension publisher.name is incorrect');
    return '';
  }
  return metaedExtension.extensionPath;
});

/**
 * Returns the path to a particular npm package directory.
 */
export function nodeModulesPath(pathStartingWithPackageDirectory: string): string {
  return path.resolve(__dirname, '../../node_modules', pathStartingWithPackageDirectory);
}

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
