# Spec: Remove Ed-Fi License Acceptance (METAED-1693)

## Objective

The Data Standard has moved to the Apache License 2.0 (DATASTD-2710). MetaEd no
longer needs users to accept the Ed-Fi License Agreement before it will lint,
build, or deploy. This work removes that gate from:

1. **MetaEd IDE** (`vscode-metaed-ide`): the `metaed.acceptedLicense` setting and
   every behavior that depends on it.
2. **MetaEd-JS CLIs** (`metaed-console`, `metaed-odsapi-deploy-console`): the
   required `-a` / `--accept-license` option.

Users:

- **Extension modelers**: they install the IDE and expect lint/build/deploy to
  work without checking a license box.
- **Existing IDE users**: they already have `"metaed.acceptedLicense": true` in
  their settings and need to know whether they must do anything.
- **CLI and CI users**: scripts such as `eng/ApiSchema/build.ps1` pass `-a` and
  must keep working.

### Decisions already made

- **Remove the gate even though DS 4.0–6.1 are still bundled.** The published
  `@edfi/ed-fi-model-4.0` … `-6.1` packages still ship the Ed-Fi License
  Agreement text with `"license": "private"`. Only DS 6.2 (`ed-fi-model`
  3.0.0-pre.3) has converted so far. The Alliance treats all Data Standard
  versions as Apache going forward. The older packages might never be
  republished, and that is acceptable.
- **Both repos are in scope**: one spec, two PRs. They don't depend on each
  other, because the extension calls the MetaEd-JS libraries rather than the
  console CLIs.
- **PRDs are living documents.** Edit them in place and simply drop the
  license requirements, with no amendment notes, because git history keeps the
  old text. In the extension, rename `docs/PRD-4.8.md` to `docs/PRD.md` and set
  its version to 4.10. In MetaEd-JS, edit `docs/PRD-4.x.md` and set its
  version to 4.10. A Sonnet subagent makes both PRD edits.
- **Branching:**
  - `vscode-metaed-ide`: branch `METAED-1693` from `main`.
  - `MetaEd-JS`: branch `METAED-1693` from the unmerged `PRD` branch, not
    `main`, so `PRD` can still merge cleanly without this change. All MetaEd-JS
    changes (code and docs) go on that branch.
- **Unregister the setting outright and document the leftover entry.** There
  is no deprecation period. VS Code won't let an extension write to a setting
  it no longer registers, so we can't clear users' values automatically. A
  leftover entry does nothing, and the docs say so.

## Tech Stack

- Extension: TypeScript, VS Code extension API, `vscode-languageclient`. Repo
  has no unit tests by design (`docs/DEVELOPMENT.md`).
- MetaEd-JS: TypeScript Lerna monorepo, `yargs` for CLI parsing, Jest.

## Commands

```bash
# vscode-metaed-ide (repo root)
npm ci
npm run test:lint           # tsc --noEmit + eslint --max-warnings 0 (what PR CI runs)
npm run package             # build + vsce -> extension/vscode-metaed.vsix
code --extensionDevelopmentPath="$PWD" <workspace>   # manual verification

# MetaEd-JS (repo root) — never `npm run build`
npx eslint --max-warnings 0 --ext .js,.ts packages/metaed-console
npx eslint --max-warnings 0 --ext .js,.ts packages/metaed-odsapi-deploy-console
npx tsc -p packages/metaed-console --noEmit
npx tsc -p packages/metaed-odsapi-deploy-console --noEmit
npx ts-node packages/metaed-console/src/index.ts -h                # verify help text
npx ts-node packages/metaed-console/src/index.ts -a -c <config>    # verify legacy -a is tolerated
```

## Project Structure (files in scope)

### vscode-metaed-ide

| File | Change |
| --- | --- |
| `package.json` | Delete the `metaed.acceptedLicense` contribution. Renumber `order` on later settings so they stay sequential. |
| `src/client/ExtensionSettings.ts` | Delete `acceptedLicense()`. |
| `src/client/LanguageClient.ts` | Remove the guards in `sendLintCommandToServer`, `metaed.build` and `metaed.deploy`. Remove `acceptedLicenseDiagnosticCollection`, `syncAcceptedLicenseDiagnostic` and `listenForAcceptedLicenseChange`, and their calls in `activate`. Startup lint still runs through the existing `window.activeTextEditor` check. |
| `README.md` | Remove the "Accepted License" bullet. Add a new `### 4.10.0` release-notes section with the user guidance below. |
| `docs/PRD-4.8.md` → `docs/PRD.md` | Rename with `git mv` and set `Version: 4.10`. In place, drop FR-LINT-7, FR-CFG-2 and NFR-SEC-1, remove `acceptedLicense` from FR-CFG-1, and remove the license mentions in the goals, personas, FR-BUILD/DEPLOY, NFR-USABILITY-1 and testing sections. Leave the remaining requirement IDs unchanged. Sonnet subagent. |
| `AGENTS.md` | Drop "license accepted" from the client-side validation list. |
| `docs/regression/PLAN.md`, `VISUAL.md`, `AGENT.md` | Retire V03 "License gating" or replace it with a "no license prompt" check. Remove license preconditions from V02 and V05. |
| `.claude/deploy-smoke/SKILL.md` | Remove the `metaed.acceptedLicense: true` setup, the `--accept-license true` argument and scenario S11. |

### MetaEd-JS

| File | Change |
| --- | --- |
| `packages/metaed-console/src/metaed-console.ts` | Delete the `accept-license` option. |
| `packages/metaed-odsapi-deploy-console/src/metaed-odsapi-deploy-console.ts` | Delete the `accept-license` option. |
| `docs/cli.md` | Remove `-a` from both help listings and the "Missing required argument" example. Add a note that `-a` is still accepted and ignored, for compatibility. |
| `eng/ApiSchema/build.ps1` | Drop `-a` from the console call. Optional, because the flag is harmless. |
| `packages/metaed-console/README.md`, `packages/metaed-odsapi-deploy-console/README.md` | Remove the `--accept-license / -a` bullet. These files come from the `PRD` branch. |
| `docs/PRD-4.x.md` | Version bumped to 4.10 (done). In place, drop FR-BUILD-2, FR-DEPLOY-2 and NFR-LIC-1, and remove the "`-a` is required" known-limitation line. Sonnet subagent. |

### Out of scope

- License headers in generated SQL and other artifacts. These already use Apache text.
- Pages on docs.ed-fi.org: the Ed-Fi License Agreement page and the IDE
  installation/settings pages. They need a follow-up ticket in the docs repo.
- Republishing `@edfi/ed-fi-model-4.0` … `-6.1` under Apache, which might
  never happen, and bumping the extension to use them.
- The extension `version` in `package.json`. The 4.10.0 release PR sets that.

## Code Style

This change only deletes code. Match the surrounding code and don't add
replacement abstractions. For example, `metaed.build` should read:

```ts
commands.registerCommand('metaed.build', () => {
  (async () => {
    const serverMessage: ServerMessage | undefined = await createServerMessage(client.outputChannel);
    if (serverMessage == null) {
      await showErrorNotification('Nothing to build.');
      return;
    }
    ...
```

- Remove imports that become unused (`DiagnosticCollection`, `Diagnostic`,
  `Range`, `Position`, `ConfigurationChangeEvent`, `Uri`) only if nothing else
  uses them. ESLint will flag them.
- Use the extension's PR title format: `[METAED-1693] Remove Ed-Fi license acceptance`.

## Testing Strategy

- **Extension:** `npm run test:lint` must pass, as CI requires. Verify manually
  in an Extension Development Host:
  - On a fresh profile with no `metaed.*` settings, opening a `.metaed` file
    lints it. Build and Deploy run with no license prompt, and Problems shows no
    "Ed-Fi License Needs Accepting" entry.
  - With `"metaed.acceptedLicense": false` left over in user settings, the
    behavior is the same. The settings JSON editor dims the entry as unknown,
    and nothing errors.
  - The Settings UI under *MetaEd* no longer lists "Accepted License", and the
    remaining settings keep their order.
- **MetaEd-JS:** directory-level `eslint` and `tsc` must pass for both console
  packages. Verify the CLIs manually:
  - `-h` output no longer lists `--accept-license`.
  - Runs **with no** `-a` succeed. Before this change they failed with
    "Missing required argument".
  - Runs **with** `-a`, `-a true` and `--accept-license yes` still succeed,
    because yargs isn't in strict mode, and `-c` still parses correctly after
    `-a`.
  - The console packages have no Jest tests, and we won't add any for an option
    deletion.
- Plugin authoritative tests are unaffected, because generators don't change.

## Boundaries

- **Always:** run lint/tsc before each commit, and keep the two repos'
  changes in separate PRs that each reference METAED-1693.
- **Ask first:** bumping `@edfi/ed-fi-model-*` or `@edfi/metaed-*` versions,
  changing the extension `version`, and pushing or opening PRs.
- **Never:** keep the setting registered "just in case", add code that writes
  to users' settings, add `.strict()` to yargs (that would break callers that
  still pass `-a`), run `npm run build` in MetaEd-JS, commit directly to the
  MetaEd-JS `PRD` branch, edit or create any PRD other than the two named
  here, or add amendment or changelog notes to a PRD.

## Success Criteria

1. `metaed.acceptedLicense` is gone from the extension's `package.json` and
   source (`git grep -i acceptedLicense` matches only release notes and this spec).
2. Lint, build and deploy in the IDE never check for, prompt for or mention license acceptance.
3. README release notes tell users clearly that **they don't need to do
   anything**. A leftover `"metaed.acceptedLicense"` entry is ignored. To tidy
   up, open *Preferences: Open User Settings (JSON)* and delete the line. Also
   check *Preferences: Open Workspace Settings (JSON)* / `.vscode/settings.json`
   if it was set per workspace.
4. Neither MetaEd-JS console requires `-a`, and existing callers that pass `-a`
   still work unchanged.
5. The extension's `docs/PRD-4.8.md` has become `docs/PRD.md` at version 4.10.
   That file, MetaEd-JS `docs/PRD-4.x.md`, `docs/cli.md`, both console READMEs,
   the extension `README.md`, `AGENTS.md`, the regression docs and the
   deploy-smoke skill no longer describe a license gate.
6. The MetaEd-JS branch is based on `PRD`, and `git diff PRD...METAED-1693`
   shows only METAED-1693 changes.
7. CI passes for both PRs.

## Resolved Questions

1. **Older Data Standard packages** might never be republished under Apache.
   That is acceptable.
2. **Release notes** go in a new `### 4.10.0` section of the extension README.
3. **PRDs** are living documents edited in place, with no amendment notes. The
   extension's `PRD-4.8.md` becomes `PRD.md` at version 4.10, and MetaEd-JS
   keeps `PRD-4.x.md`, also at version 4.10. A Sonnet subagent edits both.
4. **MetaEd-JS branch** is based on `PRD`, not `main`.
