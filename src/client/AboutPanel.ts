// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import fs from 'node:fs';
import * as path from 'node:path';
// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import * as R from 'ramda';
import { scanForPlugins, newState } from '@edfi/metaed-core';
import { LICENSE_URL } from './Utility';

/**
 * The package.json file for the currently running vscode-metaed. Used to introspect the
 * installed MetaEd plugins.
 */
const vscodeMetaEdPackageJson: () => any | null = R.memoizeWith(R.identity, () => {
  try {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJsonFile: string = fs.readFileSync(packageJsonPath).toString();
    return JSON.parse(packageJsonFile);
  } catch {
    return null;
  }
});

export class AboutPanel {
  /**
   * Only allow a single panel to exist at a time.
   */
  // eslint-disable-next-line no-use-before-define
  static currentPanel: AboutPanel | undefined;

  static viewType = 'aboutPanel';

  #myPanel: vscode.WebviewPanel;

  #extensionPath: string;

  #disposables: vscode.Disposable[] = [];

  static createOrShow(extensionPath: string) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // If we already have a panel, show it.
    if (AboutPanel.currentPanel) {
      AboutPanel.currentPanel.#myPanel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(AboutPanel.viewType, 'About', column || vscode.ViewColumn.One, {
      // Enable javascript in the webview
      enableScripts: true,

      // And restrict the webview to only loading content from our extension's `static` directory.
      localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'static'))],
    });

    AboutPanel.currentPanel = new AboutPanel(panel, extensionPath);
  }

  static revive(panel: vscode.WebviewPanel, extensionPath: string) {
    AboutPanel.currentPanel = new AboutPanel(panel, extensionPath);
  }

  private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
    this.#myPanel = panel;
    this.#extensionPath = extensionPath;

    // Set the webview's initial html content
    this.#update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this.#myPanel.onDidDispose(() => this.dispose(), null, this.#disposables);

    // Update the content based on view changes
    this.#myPanel.onDidChangeViewState(
      () => {
        if (this.#myPanel.visible) {
          this.#update();
        }
      },
      null,
      this.#disposables,
    );

    // Handle messages from the webview
    this.#myPanel.webview.onDidReceiveMessage(
      (message) => {
        (async () => {
          switch (message.command) {
            case 'alert':
              await vscode.window.showErrorMessage(message.text);
              break;
            default:
              break;
          }
        })();
      },
      null,
      this.#disposables,
    );
  }

  dispose() {
    AboutPanel.currentPanel = undefined;

    // Clean up our resources
    this.#myPanel.dispose();

    while (this.#disposables.length) {
      const x = this.#disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  #update() {
    const pluginList: string[] = scanForPlugins(newState()).map((pm) => `${pm.npmName} ${pm.version}`);
    const metaEdPackageJson: any | null = vscodeMetaEdPackageJson();
    const version: string = metaEdPackageJson == null ? '' : ` v${metaEdPackageJson.version}`;
    const backgroundUri = this.#myPanel.webview.asWebviewUri(
      vscode.Uri.file(path.resolve(this.#extensionPath, './static/MetaEd-About-Background.png')),
    );

    this.#myPanel.title = 'About MetaEd';
    this.#myPanel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta name="viewport" content="width=device-width">
        <title>About MetaEd</title>
    </head>
    <body>
      <div style='display: flex; flex-flow: column wrap; justify-content: center; align-items: center; height: 100%; width: 100%;'>
        <div style='position: relative;'>
          <img src='${backgroundUri}' alt=''/>

          <p style='position:absolute; bottom:0; font-size:11px; font-family:"Arial"; padding:0px 37px; width:100%; height:185px; text-align:left; overflow-y:scroll'>
            MetaEd is © 2023 Ed-Fi Alliance, LLC. Click <a href="${LICENSE_URL}">here</a> for license information.
            <br/>
            vscode-metaed${version}
            <br/>
            <br/>
            ${pluginList.length > 0 ? 'Installed Plugins: <br/>' : ''}
            ${pluginList.join('<br/>')}
          </p>
        </div>
      </div>
    </body>
  `;
  }
}
