# Agent instructions for MetaEd regression testing

Execute [PLAN.md](PLAN.md) against the current checkout. Default to the routine matrix and
agent cases A01–A16. Prepare V01–V11 for a visual tester. Report conditional cases explicitly.
This repository has no regression runner yet: create a temporary harness in the run directory,
or use an existing reviewed runner if one has since been added. Do not add permanent unit tests
or change product code merely to execute this plan.

## Run

1. Record Git status/commit, OS, tool versions, package/lock versions, installed `@edfi/metaed-*`
   versions, and DS project versions. Check `AGENTS.md` and current client/server contracts.
   Reconcile the plan's matrix with the checkout; do not substitute different versions silently.
2. Create a unique external run directory and the plan's fixtures/workspaces/deployment skeletons.
   Copy DS models. Store pristine fixture hashes and planned assertions before mutations.
   Keep generated evidence outside the repository. Use the declared installed engine packages;
   local tarball wiring is only for an explicitly selected unpublished-engine run.
3. Run `npm run test:lint` and `npm run package`, saving output. If dependencies are missing or
   inconsistent with the lockfile, restore them with `npm ci` first and record that action.
   Stop dependent cases if compilation/package prerequisites fail.
4. Resolve modules from the IDE checkout, not an unrelated MetaEd-js checkout. Use a fresh
   `newState()` per pipeline execution, the installed `defaultPlugins()`, and a configuration
   built with `newMetaEdConfiguration()`. Set DS project version, target version (semver),
   project paths/metadata, and absolute output/deploy paths explicitly.
5. Run the selected A rows, resetting the fixture between mutations. Save stdout/stderr, engine
   failures, diagnostic payloads, and assertions. Match the **specific** expected diagnostic;
   “some error occurred” is insufficient. Unexpected plugin exceptions fail the case.
6. Verify generated contents and deployment mappings from the plan. Use clean directories,
   start timestamps, relative-path manifests, and hashes. Inspect `odsApiVersion` in generated
   metadata to verify which target actually built. Run X cases only with their required setup;
   otherwise report Blocked or Skipped with the concrete reason.
7. Prepare the visual handoff below. Continue independent A/X work while awaiting screenshots.
   Inspect each image/recording and pair it with disk/log evidence. Missing or inconclusive
   visual proof leaves the V row Blocked; never substitute an A pass.
8. Write the report, including all selected subcases/pairs and conditional/deferred coverage.
   Restore test settings/files and verify repository status. State whether only agent coverage
   or the complete routine regression passed. Retain the run directory as evidence.

## Harness contract

Follow the real source in `src/server/LanguageServer.ts`, `src/server/Linter.ts`, and
`src/client/ServerMessageFactory.ts`; do not reimplement parsing or validation.

| Operation | Required adapter |
| --- | --- |
| Build | `executePipeline`: validators/enhancers/generators true, stop-on-validation-failure true. Set `state.metaEd.dataStandardVersion`. Assert returned failure status, validation failures, logged exceptions, and outputs. |
| Diagnostics | Call compiled `dist/server/Linter.js` `lint()` with the real `ServerMessage`; capture `sendDiagnostics` and connection logging. Use validators/enhancers as the linter does. Reuse the loaded linter for A09 so clearing behavior is tested. |
| Deploy files | `runDeployTasks(configuration, dataStandardVersion, deployCore, suppressDelete, additionalMssqlScriptsDirectory, additionalPostgresScriptsDirectory)`. A12–A15 use a fresh successful build. |
| Transport/failure sequence | Start the compiled language server with the real JSON-RPC transport, send `metaed/lint`, `metaed/build`, and `metaed/deploy`, collect diagnostics/completion/log notifications. A16 must exercise the server's own failed-build/deploy sequence. |

For Sample, configuration project metadata includes `namespaceName: "Sample"`,
`projectName: "Sample"`, `projectVersion: "1.0.0"`, and `projectExtension: "EXTENSION"`.
For the DS use `namespaceName: "EdFi"`, `projectName: "Ed-Fi"`, its project version, and
`projectExtension: ""`. Order project metadata and paths consistently. Set the IDE-equivalent
output to `<sample>/MetaEdOutput` for visual runs; keep headless outputs separate.
Headless output paths must also contain `MetaEdOutput` so the engine permits rebuilding them.

Set bounded timeouts and record elapsed time; allow longer generation time than lint time.
Do not run concurrent commands against the same server, fixture, or output directory.
Use meaningful content assertions, not a hard-coded output count. A complete deployment
manifest must account for every deployable source file and unexpected destination files.

Client guards (license, project discovery, compatibility, directory validation) are V cases.
Calling the engine directly bypasses them. A mocked `vscode` module does not prove their
real integration; do not report such a mock as V evidence.

## Visual handoff

Provide the tester:

- Absolute IDE or disposable VSIX installation path, version/hash, and run directory.
- One named `.code-workspace` per pair/setup and a one-line launch command for each.
- The exact fixture edit/revert snippets, applicable case IDs, and expected diagnostic text/ranges.
- [VISUAL.md](VISUAL.md) and an evidence folder named by case, pair, and action.

Launch a development host with:

```bash
code --extensionDevelopmentPath="<absolute-ide-path>" "<absolute-workspace-path>"
```

Before switching workspaces, close all **test Extension Development Host** windows and launch
exactly one. Confirm its title and Explorer folders before any action; the CLI can focus an
existing host instead of the requested workspace. Keep unrelated VS Code windows intact.

For V10/V13 use an isolated profile/extensions directory and a disposable copy of the packaged
extension so bundled-file and installation checks cannot affect the user's working installation.
Do not let a development checkout mask the installed extension under test. Verify the active
extension path/version. A disposable copy outside `node_modules/@edfi` is not a bundled-file test.

After each visual Build/Deploy, verify the on-disk target version, fresh artifacts, and hashes
before recording a pass. For negative client guards, compare before/after output and target
manifests; the visible error alone does not establish that no work occurred.
