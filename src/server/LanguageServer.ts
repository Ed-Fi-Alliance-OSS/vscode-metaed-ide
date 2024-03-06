// The Ed-Fi Alliance licenses this file to you under the Ed-Fi License Agreement.
// See the LICENSE file in the project root for more information.

import { Connection, createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { State, executePipeline, newState } from '@edfi/metaed-core';
import { defaultPlugins } from '@edfi/metaed-default-plugins';
import { DeployResult, runDeployTasks } from '@edfi/metaed-odsapi-deploy';
import type { DeployParameters } from '../model/DeployParameters';
import { lint } from './Linter';
import { ServerMessage } from '../model/ServerMessage';

// The connection to the client
const clientConnection: Connection = createConnection(ProposedFeatures.all);

/**
 * Set up and call the metaed-core build process
 * @returns true if the build was successful
 */
async function build({ metaEdConfiguration, dataStandardVersion }: ServerMessage): Promise<boolean> {
  const state: State = {
    ...newState(),
    pipelineOptions: {
      runValidators: true,
      runEnhancers: true,
      runGenerators: true,
      stopOnValidationFailure: true,
    },
    metaEdConfiguration,
    metaEdPlugins: defaultPlugins(),
  };
  state.metaEd.dataStandardVersion = dataStandardVersion;

  type PipelineResult = { state: State; failure: boolean };
  const { failure: isFailure }: PipelineResult = await executePipeline(state);
  return !isFailure;
}

/**
 * Set up and call the metaed-odsapi-deploy build process
 * @returns true if the deploy was successful
 */
async function deploy({ serverMessage, deployCore, suppressDelete }: DeployParameters): Promise<DeployResult> {
  return runDeployTasks(serverMessage.metaEdConfiguration, serverMessage.dataStandardVersion, deployCore, suppressDelete);
}

clientConnection.onNotification('metaed/build', (serverMessage: ServerMessage) => {
  (async () => {
    clientConnection.console.log(`${Date.now()}: Server received build command from client`);

    const success: boolean = await build(serverMessage);

    clientConnection.console.log(`${Date.now()}: Server sending build complete notification to client`);
    await clientConnection.sendNotification('metaed/buildComplete', success);
  })();
});

clientConnection.onNotification('metaed/deploy', (deployParams: DeployParameters) => {
  (async () => {
    clientConnection.console.log(`${Date.now()}: Server received deploy command from client`);

    const buildSuccess: boolean = await build(deployParams.serverMessage);

    clientConnection.console.log(`${Date.now()}: Server sending build complete notification to client`);
    await clientConnection.sendNotification('metaed/buildComplete', buildSuccess);

    const deployResult: DeployResult = await deploy(deployParams);

    clientConnection.console.log(`${Date.now()}: Server sending deploy complete notification to client`);
    await clientConnection.sendNotification('metaed/deployComplete', deployResult);
  })();
});

clientConnection.onNotification('metaed/lint', (serverMessage: ServerMessage) => {
  (async () => {
    clientConnection.console.log(`${Date.now()}: Server received lint command from client`);
    await lint(serverMessage, clientConnection);
  })();
});

// Make connection listen
clientConnection.listen();
