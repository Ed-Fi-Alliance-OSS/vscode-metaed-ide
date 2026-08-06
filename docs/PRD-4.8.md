# Product Requirements Document: MetaEd IDE

- Owner: Stephen Fuqua
- Version: 4.8
- Status: completed
- Repository: Ed-Fi-Alliance-OSS/vscode-metaed-ide
- Platform and runtime: Visual Studio Code extension

> [!TIP]
> This PRD defines the product requirements for _only_ MetaEd's Visual Studio
> Code extension - it does not cover the MetaEd generators and command line
> interface, or the domain specific language (DSL).

## 1. Product overview

MetaEd IDE is a Visual Studio Code extension that provides an integrated
development experience for authoring **MetaEd model files**. These files use a
domain-specific language (DSL) to define and extend the Ed-Fi Data Standard and
to generate supporting artifacts for the Ed-Fi ODS/API and Ed-Fi API
applications. The extension itself contains no DSL parsing, validation, or
generation logic - it is a thin client/server shell that packages the
`@edfi/metaed-*` npm libraries (maintained in the MetaEd-js repository) and
exposes their capabilities through VS Code's UI, commands, and Language Server
Protocol (LSP) diagnostics.

It serves two audiences: the Ed-Fi Alliance's own Data Standard core team
(authoring the base Ed-Fi model) and community/vendor developers who author
**extension** projects on top of the core Data Standard for their own API
implementations.

## 1.1 Strategic alignment

- Reduce the barrier to entry for writing valid MetaEd DSL by providing syntax
  highlighting, real-time linting, and one-click build/deploy inside a familiar
  editor (VS Code).
- Keep pace with the Ed-Fi Alliance's supported product matrix: each MetaEd IDE
  release tracks a specific set of supported ODS/API versions and Data Standard
  versions (see release notes in `README.md`, e.g., 4.7.0 -> DS 6.1, 4.6.0 ->
  ODS/API 7.3 + DS 6.0, 4.3.0 -> drops end-of-life versions). Version
  compatibility is enforced in `DataStandardManager.ts`.
- Distribute official Data Standard model projects bundled with the extension
  (`@edfi/ed-fi-model-*` packages) so users are not required to separately
  locate or clone them.
- Require acceptance of the Ed-Fi Unifying Data Model license before any
  build/deploy action can run, since the Data Standard content is licensed
  separately from the extension's Apache 2.0 code.

## 1.2 Target users and personas

- **Ed-Fi Data Standard core author ("Alliance" persona).** Works on the
  canonical Ed-Fi Data Standard itself. Needs `metaed.allianceMode` enabled to
  make bundled core Data Standard files editable (normally read-only) and to
  have `metaed.deploy` also deploy the core model, not just extensions.
- **Extension/vendor developer.** Builds a MetaEd extension project on top of a
  bundled, read-only Data Standard project. Needs linting to catch DSL errors
  quickly, a build command to generate artifacts, and a deploy command to push
  generated artifacts into a local Ed-Fi ODS/API source checkout for local
  testing.
- **Both personas** need clear, actionable error messages when: the license is
  not accepted, no Data Standard project is present, the wrong Data Standard
  version is present for the selected ODS/API target, or the ODS/API deployment
  directory is misconfigured.

## 1.3 Jobs to be done

- When I'm writing or changing a MetaEd model, I want to know right away whether
  it's valid, so I can correct mistakes while I still remember the context
  behind them, rather than discovering problems later in a build.
- When my model is ready, I want to turn it into the artifacts my downstream
  systems consume (database schemas, XSDs, documentation, etc.), so I can move
  from model to implementation without hand-translating the DSL myself.
- When I want to see my model changes actually working, I want to get them into
  a local ODS/API instance with minimal manual effort, so I can validate my work
  end-to-end before sharing it.
- When my workspace can't produce a valid result because the Data Standard is
  missing or mismatched with my target ODS/API version, I want to understand why
  and what to do about it, so I can get back to productive work without digging
  through external documentation.
- When I'm authoring the canonical Ed-Fi Data Standard itself rather than an
  extension, I want the tooling to treat that as my normal job, not a
  locked-down special case, so I'm not fighting protections meant for other
  users.
- When I'm new to MetaEd, I want an easy way to get a working baseline model in
  place, so I can start being productive without first having to track down the
  right files on my own.

## 2. Enterprise or system context

- **Host application:** Visual Studio Code (`engines.vscode` `^1.76.0`),
  installed from the VS Code Marketplace or as a manually distributed `.vsix`.
- **Runtime architecture:** Standard VS Code extension client/server split using
  `vscode-languageclient` / `vscode-languageserver` over IPC. The client
  (`LanguageClient.ts`) runs in the VS Code extension host; the server
  (`LanguageServer.ts`) runs as a separate Node.js process and is where all
  `@edfi/metaed-*` pipeline calls happen.
- **External dependency (out of scope, consumed only):** `@edfi/metaed-core`,
  `@edfi/metaed-default-plugins`, `@edfi/metaed-console`,
  `@edfi/metaed-odsapi-deploy`, and the full family of
  `@edfi/metaed-plugin-edfi-*` packages - these implement DSL parsing, semantic
  validation, enhancers, and artifact generators (relational, XSD, SQL
  Server/PostgreSQL, change query, record ownership, handbook, XML/SQL
  dictionary, ODS/API). Version-locked in lockstep with the extension's own
  `package.json` version.
- **Bundled data:** `@edfi/ed-fi-model-4.0` through `@edfi/ed-fi-model-6.1` npm
  packages ship inside the extension's `node_modules` and serve as the "bundled
  Data Standard projects" that users can add to their workspace.
- **External file system integration:** Deploy requires a local, user-provided
  checkout of `Ed-Fi-ODS` and `Ed-Fi-ODS-Implementation` repositories (path
  configured via `metaed.odsApiDeploymentDirectory`); optional user-provided
  folders of post-deploy MSSQL/Postgres scripts may also be merged in.
- **Distribution/release pipeline:** GitHub Actions workflows
  (`on-pullrequest.yml`, `on-merge-or-tag.yml`, `on-prerelease.yml`,
  `on-release.yml`, `scorecard.yml`) automate PR CI, pre-release creation from
  `package.json` version bumps, VSIX build/attach, and marketplace publishing
  when a pre-release is promoted to a full release. OpenSSF Scorecard runs as a
  supply-chain security check.

## 3. Functional requirements

### Language support (FR-LANG)

- **FR-LANG-1**: The extension SHALL register a `metaed` VS Code language
  associated with `.metaed` file extensions, including a TextMate grammar
  (`syntaxes/metaed.tmLanguage.json`) for syntax highlighting and a language
  configuration (line comment `//`).

### Linting (FR-LINT)

- **FR-LINT-1**: The extension SHALL run MetaEd validation (via
  `@edfi/metaed-core` `executePipeline` with validators and enhancers enabled,
  generators disabled) whenever the accepted license setting is true.
- **FR-LINT-2**: The extension SHALL trigger a debounced (500ms) lint
  automatically on: active editor change to a `.metaed` file, text changes to an
  open `.metaed` document, and closing of a `.metaed` document.
- **FR-LINT-3**: The extension SHALL expose a `metaed.lint` command for manually
  triggering a lint pass. Unlike `metaed.build`/`metaed.deploy`/`metaed.crash`,
  this command is intentionally not declared in `package.json`
  `contributes.commands` and has no title-bar icon or Command Palette entry -
  since linting already runs automatically on document changes (FR-LINT-2), a
  discoverable manual trigger is not needed; the command remains reachable via
  a user-defined keybinding or programmatically.
- **FR-LINT-4**: The extension SHALL run an initial lint on activation if a
  `.metaed` file is already the active editor, and again whenever the
  license-acceptance setting changes to accepted.
- **FR-LINT-5**: The extension SHALL translate MetaEd validation failures into
  VS Code diagnostics (errors or warnings, based on failure category) attached
  to the specific file and line/column when file/source mapping is available, or
  to a virtual "Validation Errors" location when not.
- **FR-LINT-6**: The extension SHALL clear diagnostics for files whose failures
  have been resolved since the previous lint pass.
- **FR-LINT-7**: If the Ed-Fi license has not been accepted, the extension SHALL
  display a persistent diagnostic instructing the user to accept the license
  under Settings, and SHALL suppress automatic linting until acceptance.

### Build (FR-BUILD)

- **FR-BUILD-1**: The extension SHALL expose a `metaed.build` command, available
  from the editor title-bar (for `.metaed` files) and the command palette, that
  runs the full MetaEd pipeline (validators, enhancers, and generators) via
  `@edfi/metaed-core` with `defaultPlugins()`.
- **FR-BUILD-2**: Build SHALL be blocked with an error notification if the Ed-Fi
  license has not been accepted.
- **FR-BUILD-3**: Build SHALL be blocked with an error notification if no valid
  MetaEd project(s) can be resolved from the current workspace (see FR-PROJ
  requirements).
- **FR-BUILD-4**: On completion, the extension SHALL notify the user of build
  success (pointing to the `MetaEdOutput` folder at the root of the last
  workspace folder) or build failure (pointing the user to the Problems window).

### Deploy (FR-DEPLOY)

- **FR-DEPLOY-1**: The extension SHALL expose a `metaed.deploy` command,
  available from the editor title-bar (for `.metaed` files) and the command
  palette, that runs a build followed by `runDeployTasks` from
  `@edfi/metaed-odsapi-deploy`.
- **FR-DEPLOY-2**: Deploy SHALL be blocked with an error notification if the
  Ed-Fi license has not been accepted, if `metaed.odsApiDeploymentDirectory` is
  unset or not a valid directory, or if that directory does not contain both an
  `Ed-Fi-ODS` and an `Ed-Fi-ODS-Implementation` subfolder.
- **FR-DEPLOY-3**: On Windows, if the deployment directory path is a bare drive
  letter (e.g. `C:`) without a trailing path separator, deploy SHALL be blocked
  with a corrective error message.
- **FR-DEPLOY-4**: Unless `metaed.allianceMode` is enabled, deploy SHALL be
  blocked with an error notification when there is no extension project to
  deploy (i.e., only the core Data Standard project is present).
- **FR-DEPLOY-5**: Deploy SHALL pass through user settings for `deployCore`
  (derived from `allianceMode`), `suppressDelete`
  (`metaed.suppressDeleteOnDeploy`), and optional
  `additionalMssqlScriptsDirectory` / `additionalPostgresScriptsDirectory` paths
  whose contents are copied into the deployed ODS/API's `MsSql/Data/Ods` or
  `PgSql/Data/Ods` folders respectively.
- **FR-DEPLOY-6**: On completion, the extension SHALL notify the user of deploy
  success (pointing to the configured deployment directory) or deploy failure
  (surfacing the failure message returned by the deploy pipeline).

### Workspace / project discovery (FR-PROJ)

- **FR-PROJ-1**: The extension SHALL treat a VS Code workspace folder as a
  MetaEd project if and only if it contains a `package.json` with both
  `metaEdProject.projectName` and `metaEdProject.projectVersion` fields.
- **FR-PROJ-2**: The extension SHALL derive each project's namespace from
  `projectName` and flag the folder as invalid if a namespace cannot be derived
  (project name must start uppercase and be alphanumeric).
- **FR-PROJ-3**: The extension SHALL validate `projectVersion` as a
  semver-compliant string and flag the folder as invalid otherwise.
- **FR-PROJ-4**: The extension SHALL classify a project with derived namespace
  `EdFi` as the core Data Standard project (`isExtensionProject: false`), and
  any other namespace as an extension project (`projectExtension: 'EXTENSION'`).
- **FR-PROJ-5**: If any workspace folder is an invalid MetaEd project, or if
  zero or more than one distinct Data Standard version is detected across
  workspace projects, lint/build/deploy SHALL be blocked with a descriptive
  error identifying the problem and, where applicable, pointing to the bundled
  Data Standard model location.
- **FR-PROJ-6**: The extension SHALL verify that the selected
  `metaed.targetOdsApiVersion` is compatible with the single detected Data
  Standard version, using a hardcoded ODS/API-to-DS semver range compatibility
  map, and SHALL block lint/build/deploy with an explanatory error (including
  the expected bundled model path) when incompatible.

### Data Standard bundling and protection (FR-DS)

- **FR-DS-1**: The extension SHALL bundle official Data Standard model npm
  packages (`@edfi/ed-fi-model-4.0` through `@edfi/ed-fi-model-6.1`) inside its
  own `node_modules`, and SHALL expose their root path (`bundledDsRootPath`) to
  users via notifications so they can add them to a VS Code workspace.
- **FR-DS-2**: The extension SHALL set bundled Data Standard project files
  read-only (chmod 0o444) whenever a workspace folder pointing into the bundled
  path is present or added, unless `metaed.allianceMode` is enabled.
- **FR-DS-3**: On activation, if no bundled Data Standard project is present in
  the workspace and Alliance mode is off, the extension SHALL show an
  informational prompt offering a one-click "Open Folder Location" action that
  opens a folder picker defaulted to the bundled model root and adds the
  selected folder to the workspace.

### Settings (FR-CFG)

- **FR-CFG-1**: The extension SHALL expose the following user/workspace settings
  under the `metaed.*` namespace: `targetOdsApiVersion` (enum of supported
  ODS/API versions, default `7.3`), `odsApiDeploymentDirectory` (string path),
  `acceptedLicense` (boolean, default false), `suppressDeleteOnDeploy` (boolean,
  default false), `allianceMode` (boolean, default false),
  `additionalMssqlScriptsDirectory` (string path), and
  `additionalPostgresScriptsDirectory` (string path).
- **FR-CFG-2**: Changing `metaed.acceptedLicense` SHALL immediately re-evaluate
  the license diagnostic and, when newly accepted, trigger an initial lint pass.

### Diagnostics / support (FR-DIAG)

- **FR-DIAG-1**: The extension SHALL expose a `metaed.crash` command that
  intentionally throws an unhandled error, for validating crash/exception
  reporting behavior.
- **FR-DIAG-2**: The extension SHALL write timestamped diagnostic/status lines
  to a dedicated "MetaEd" VS Code output channel for build, deploy, and lint
  request/response events.

## 4. Non-functional requirements

- **NFR-COMPAT-1**: The extension SHALL declare compatibility with VS Code
  `^1.76.0` and SHALL be packaged as a standard `.vsix` via `@vscode/vsce`.
- **NFR-COMPAT-2**: The extension's own version and all `@edfi/metaed-*`
  dependency versions SHALL move in lockstep (same version string) with what
  MetaEd-js publishes; `@edfi/ed-fi-model-*` package versions are independent
  and are not bumped as part of a MetaEd-js sync (per `CLAUDE.md`).
- **NFR-SEC-1**: Ed-Fi Unifying Data Model usage SHALL require explicit license
  acceptance (`metaed.acceptedLicense`) before any lint, build, or deploy action
  executes.
- **NFR-SEC-2**: Bundled core Data Standard files SHALL be protected from
  accidental modification via read-only file permissions, except when the user
  explicitly enables Alliance mode.
- **NFR-SEC-3** (supply chain): The repository SHALL run OpenSSF Scorecard
  checks (`scorecard.yml`) on an ongoing basis.
- **NFR-OPS-1** (release automation): Merging a `package.json` version bump to
  `main` SHALL automatically create a GitHub pre-release tagged with that
  version and attach a built VSIX; promoting that release out of "pre-release"
  SHALL trigger publishing to the Visual Studio Marketplace (per
  `docs/DEVELOPMENT.md`).
- **NFR-OPS-2** (extensibility of target versions): Adding support for a new
  ODS/API or Data Standard version SHOULD only require updates to the
  `targetOdsApiVersion` enum, the `odsApiToDsVersionRange` map, and the
  `dsVersionRangeToModelProjectDirectory` switch, plus bumping/adding the
  relevant `@edfi/ed-fi-model-*` and `@edfi/metaed-*` dependencies.
- **NFR-SDLC-1**: PR CI (`on-pullrequest.yml`) SHALL run `test:lint` (TypeScript
  `--noEmit` type checking plus ESLint with `--max-warnings 0`) and SHOULD keep
  it green as a merge gate (per `CLAUDE.md`).
- **NFR-SDLC-2**: The project intentionally SHALL NOT maintain a VS Code
  integration unit test suite; MetaEd business logic correctness is verified in
  the MetaEd-js repository instead (per `docs/DEVELOPMENT.md`). Manual smoke
  testing of deploy behavior against real ODS/API targets is documented as an
  interactive protocol (`.claude/deploy-smoke/SKILL.md`).
- **NFR-PERF-1**: Lint requests triggered by document edits SHALL be debounced
  (500ms) to avoid redundant full validation pipeline runs while the user is
  actively typing.
- **NFR-PERF-2** (known limitation): The packaged VSIX SHALL NOT be
  bundled/minified, because MetaEd plugin packages are loaded dynamically at
  runtime and static bundling/tree-shaking would break that dynamic loading;
  this results in a large (~13 MB) VSIX (per `docs/DEVELOPMENT.md`).
- **NFR-USABILITY-1**: All blocking conditions across lint/build/deploy (license
  not accepted, missing or invalid project(s), DS/ODS-API mismatch,
  missing/invalid deploy directory) SHALL surface a specific, actionable error
  notification rather than a silent failure or generic error.

## 5. System architecture

| Component | Responsibility | Runtime location | Key files |
| --- | --- | --- | --- |
| Language Client | Extension entry point; registers commands, settings-driven validation, UI notifications, workspace folder/file watchers; starts and communicates with the language server over IPC | VS Code extension host process | `src/client/LanguageClient.ts` |
| Extension Settings | Typed accessors over VS Code workspace configuration for all `metaed.*` settings | Extension host process | `src/client/ExtensionSettings.ts` |
| Project Finder | Scans workspace folders' `package.json` files to identify valid/invalid MetaEd projects and derive namespace/version metadata | Extension host process | `src/client/ProjectFinder.ts` |
| Data Standard Manager | Maps ODS/API versions to supported Data Standard semver ranges; locates bundled DS model packages; enforces read-only permissions on bundled DS files | Extension host process | `src/client/DataStandardManager.ts` |
| Server Message Factory | Assembles the `ServerMessage` (MetaEd configuration + Data Standard version) sent to the language server for lint/build, validating project/version preconditions first | Extension host process | `src/client/ServerMessageFactory.ts` |
| Language Server | Receives `metaed/build`, `metaed/deploy`, `metaed/lint` notifications; invokes `@edfi/metaed-core` pipeline and `@edfi/metaed-odsapi-deploy`; returns completion notifications | Separate Node.js process (LSP over IPC) | `src/server/LanguageServer.ts` |
| Linter | Runs the validation-only pipeline and converts MetaEd validation failures into LSP diagnostics | Language server process | `src/server/Linter.ts` |
| Shared models | Type definitions shared by client and server (`ServerMessage`, `DeployParameters`, `ProjectMetadata`, `WorkspaceProjects`, `InvalidProject`, `ProjectJsonFields`) | Shared (compiled to both) | `src/model/*.ts` |
| Language grammar | TextMate grammar and language configuration for `.metaed` files | Static assets loaded by VS Code | `syntaxes/metaed.tmLanguage.json`, `language-configuration.json` |
| Bundled Data Standard models | Read-only reference Data Standard projects distributed with the extension | Extension's own `node_modules/@edfi/ed-fi-model-*` | `package.json` dependencies |
| MetaEd business logic (external, out of scope) | DSL parsing, validation, enhancement, and artifact/deploy generation | npm dependency, executed in-process within the language server | `@edfi/metaed-*` packages (MetaEd-js repository) |
| Release pipeline | CI, pre-release creation, VSIX build, marketplace publish, supply-chain scorecard | GitHub Actions | `.github/workflows/*.yml` |

## 6. Out of scope and known limitations

- **Out of scope for this PRD:** MetaEd DSL grammar/parsing rules, semantic
  validation rules, artifact generator implementations (SQL, XSD, documentation,
  change query, record ownership, handbook, etc.), and ODS/API deploy task
  implementation details - all owned and documented by the MetaEd-js repository.
- **Out of scope for this PRD:** hosting or managing an actual Ed-Fi ODS/API
  runtime; deploy only writes generated artifacts into a user-supplied local
  ODS/API source checkout.
- **Known limitation:** The VSIX cannot be bundled/minified due to MetaEd's
  dynamic plugin loading, resulting in a large (~13 MB) package
  (`docs/DEVELOPMENT.md`).
- **Assumption:** Only one Data Standard project version may exist across all
  workspace folders at a time; multi-Data-Standard-version workspaces are
  explicitly unsupported (FR-PROJ-5).
- **Assumption:** "Deploy" always performs a build first; there is no way to
  deploy previously generated artifacts without re-running the full pipeline.
- **Deferred/not implemented (per this codebase):** No unit/integration test
  suite for the VS Code integration layer exists by design; correctness of
  MetaEd logic is validated upstream.

## 6.1 Proposed improvements (not yet implemented)

These are forward-looking, non-committed proposals based on limitations observed
in the current codebase and documentation. They are not confirmed roadmap items
and require product/engineering sign-off before being treated as requirements.

- PR-1 (SHOULD): Investigate a partial bundling strategy (e.g., bundling only
  statically-imported client/server code while leaving dynamically-loaded
  `@edfi/metaed-plugin-*` packages unbundled) to reduce the ~13 MB VSIX size
  without breaking dynamic plugin loading.
- PR-2 (SHOULD): Remove the stale `telemetryConsent` code - the `telemetryConsent()`
  accessor in `ExtensionSettings.ts` and the unused `TelemetryLogger` plumbing in
  `LanguageClient.ts` reference a setting that was never declared in `package.json`
  `contributes.configuration`; its README documentation was removed as stale
  (README no longer describes a "Telemetry Consent" setting). Delete the dead
  code, or reinstate the setting (with a `package.json` declaration and
  documentation) if a telemetry feature is still planned.
- PR-3 (MAY): Add lightweight automated smoke tests (e.g., headless VS Code
  extension tests) for the client-side gating logic (license/project/version
  checks in `ServerMessageFactory.ts` and the `metaed.build`/`metaed.deploy`
  command handlers), since this logic is unique to the extension and not covered
  by MetaEd-js's own test suite, while still avoiding duplicating MetaEd-js's
  DSL logic tests.
- PR-4 (MAY): Support workspaces with more than one Data Standard version
  present (e.g., allow the user to pick which one applies) instead of
  hard-blocking, if a real user need for multi-DS workspaces emerges.

## 7. Open questions and decision log

- OQ-1: Should the "single Data Standard version per workspace" constraint
  (FR-PROJ-5) remain a hard requirement, or is there a known/anticipated need to
  support multiple Data Standard versions in one workspace (e.g., for migration
  scenarios)?
- Decision (recorded, not open): Bundling/minifying the VSIX is deliberately not
  attempted due to MetaEd's dynamic plugin loading (see `docs/DEVELOPMENT.md`);
  accepted as a known limitation rather than a defect.
- Decision (recorded, not open): No VS Code integration unit test suite is
  maintained by design, since MetaEd logic correctness is the responsibility of
  the MetaEd-js repository.

## 8. Glossary

- **MetaEd:** The Ed-Fi-aligned domain-specific language (DSL) used to define
  and extend the Ed-Fi Data Standard model and generate ODS/API artifacts.
- **Data Standard (DS):** The canonical Ed-Fi data model, versioned (e.g., 4.0,
  5.0, 5.1, 5.2, 6.0, 6.1) and distributed as bundled `@edfi/ed-fi-model-*` npm
  packages.
- **ODS/API:** The Ed-Fi Operational Data Store / API, the reference
  implementation that consumes generated MetaEd artifacts; versioned
  independently of the Data Standard (e.g., 6.1, 6.2, 7.1, 7.2, 7.3).
- **Extension project:** A MetaEd project whose derived namespace is not `EdFi`;
  adds to or customizes the core Data Standard model for a specific
  implementation's needs.
- **Core project:** The MetaEd project whose derived namespace is `EdFi`,
  representing the canonical Ed-Fi Data Standard itself.
- **Alliance mode (`metaed.allianceMode`):** A setting that unlocks editing of
  bundled core Data Standard files and includes the core project in deploy
  operations; intended only for Ed-Fi Alliance staff.
- **MetaEd-js:** The separate repository/npm package family (`@edfi/metaed-*`)
  implementing all MetaEd DSL parsing, validation, enhancement, and generation
  logic. Out of scope for this PRD.
- **LSP:** Language Server Protocol; used for the client/server split between
  the VS Code extension host and the Node.js process that runs the MetaEd
  pipeline.
- **`ServerMessage`:** The payload (MetaEd configuration + Data Standard
  version) sent from the client to the server for lint and build operations.
