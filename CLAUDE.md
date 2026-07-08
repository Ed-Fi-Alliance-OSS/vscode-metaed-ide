# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

The MetaEd IDE — a VS Code extension that is a thin UI shell around the MetaEd engine. All
language logic (parsing, validation, artifact generation, ODS/API deploy) lives in the separate
[MetaEd-js](https://github.com/Ed-Fi-Alliance-OSS/MetaEd-js) monorepo and arrives here as
`@edfi/metaed-*` npm packages. Changes to build/deploy behavior are almost always made in
MetaEd-js and consumed here via a dependency bump, not implemented in this repo.

## Commands

```bash
npm run build        # clean, copy non-TS assets, tsc -> dist/
npm run test:lint    # tsc --noEmit + eslint (--max-warnings 0)
npm run package      # build + vsce -> extension/vscode-metaed.vsix
```

There are no unit tests, by design (see docs/DEVELOPMENT.md) — the MetaEd logic is tested in the
MetaEd-js packages. `test:lint` is what PR CI runs (plus CodeQL and a VSIX build); keep it green.

To run the extension: launch an Extension Development Host with
`code --extensionDevelopmentPath="<this repo>" <workspace>`. The language server can be debugged
on port 6009 (see `debugOptions` in LanguageClient.ts).

## Architecture

LSP client/server pair, both compiled from `src/` to `dist/`:

- **`src/client/LanguageClient.ts`** — extension entry point (`main` in package.json). Starts the
  language server over IPC, registers the `metaed.build` / `metaed.deploy` / `metaed.lint`
  commands, debounces lint on .metaed document events, and surfaces server results as VS Code
  notifications. All user-facing validation (license accepted, deploy directory exists and
  contains `Ed-Fi-ODS` + `Ed-Fi-ODS-Implementation`) happens client-side before messaging the
  server.
- **`src/server/LanguageServer.ts`** — the LSP server process. Handles custom notifications
  `metaed/build`, `metaed/deploy`, `metaed/lint`; delegates to `executePipeline` from
  `@edfi/metaed-core` (with `defaultPlugins()`) and `runDeployTasks` from
  `@edfi/metaed-odsapi-deploy`. Deploy always runs a build first.
- **`src/client/ServerMessageFactory.ts`** — builds the `ServerMessage` (a `MetaEdConfiguration`
  plus `dataStandardVersion`) that every notification carries, from workspace folders + settings.
  Enforces: exactly one Data Standard project per workspace, and DS/ODS-API version compatibility.
- **`src/client/ProjectFinder.ts`** — a workspace folder counts as a MetaEd project iff its
  `package.json` has `metaEdProject.projectName` and `.projectVersion`.
- **`src/client/DataStandardManager.ts`** — the ODS/API ↔ Data Standard compatibility map
  (6.1/6.2 require DS 4.0.0 exactly; 7.x accepts >=4.0.0). Bundled DS models ship inside the
  extension as `@edfi/ed-fi-model-*` dependencies and are made read-only on activation
  (`allianceMode` setting disables that protection for Alliance staff).
- **`src/model/`** — types shared by client and server.

## Versioning and release

The package `version` and all `@edfi/metaed-*` dependency versions move in lockstep with what
MetaEd-js publishes to npm: `X.Y.Z-dev.N` prereleases between releases, exact release versions at
release time. The `@edfi/ed-fi-model-*` packages version independently — don't bump them as part
of a metaed sync.

Release flow (docs/DEVELOPMENT.md): merging a `package.json` version change to `main`
auto-creates a GitHub pre-release with the VSIX attached; flipping the release off "pre-release"
publishes it to the Visual Studio Marketplace. Sync PRs look like #77 (bump deps + version to a
dev prerelease); release PRs look like #78 (bump everything to the release version).

PR titles reference a Jira ticket: `[METAED-XXXX] Description`.

## Deploy smoke testing

`.claude/deploy-smoke/SKILL.md` is an interactive protocol for verifying build/deploy against
real ODS/API 6.x/7.x targets through the Extension Development Host. Use it when validating a
MetaEd-js dependency bump that touches deploy behavior.

## Constraints

- The VSIX cannot be bundled/minified: MetaEd loads plugin packages dynamically, so tree-shaking
  breaks it (see docs/DEVELOPMENT.md).
- Node 20 is what CI uses; TypeScript is pinned old (4.8) along with the airbnb ESLint stack —
  expect older syntax limits.
