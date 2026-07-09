---
name: deploy-smoke
description: "Interactive ODS/API deploy smoke test protocol: verify deploys to 6.x/7.x targets through the real VS Code extension using locally built packages. Claude drives setup and disk verification; the user clicks Build/Deploy in the Extension Development Host."
argument-hint: "[6x|7x|tpdm|extended|all]"
allowed-tools: ["Bash", "PowerShell", "Glob", "Grep", "Read", "Write", "Edit"]
---

# /deploy-smoke - ODS/API Deploy Smoke Test Protocol

Interactive smoke test of MetaEd deploy behavior through the real `vscode-metaed-ide` extension,
wired to the locally built packages. First used for METAED-1665 (6.x deploy silently no-oping);
the original run and results are recorded on that Jira ticket.

**Division of labor:** Claude cannot click inside the Extension Development Host. Claude does
pre-flight, launches windows, verifies results on disk, and records outcomes. The user runs
`MetaEd: Build` and `MetaEd: Deploy` (Ctrl+Shift+P) and reports the notifications.

`$ARGUMENTS`: which matrix rows to run — `6x` (S1/S4/S2), `7x` (S3), `tpdm` (S15), `extended`
(S5–S14, non-blocking editor scenarios), or `all` (default: all blocking rows; does NOT include `extended`).

## Phase 0 — Preconditions (Claude, before involving the user)

Two pieces of environment must exist. Check both; rebuild whatever is missing.

### 0a. Local packages wired into the extension

You need a `vscode-metaed-ide` checkout; ask the user where it is if unknown (e.g. `C:\Temp\vscode-metaed-ide`
— referred to as `<ide>` below). If none exists, clone it first:
`git clone https://github.com/Ed-Fi-Alliance-OSS/vscode-metaed-ide <ide>` (an empty folder is NOT enough —
the extension's source and build scripts come from that repo). Its `package.json` must reference local tarballs (`file:./local-tarballs/*.tgz`)
for all `@edfi/metaed-*` deps, with an `overrides` block for transitive-only packages
(`metaed-plugin-edfi-api-catalog`, `metaed-plugin-edfi-api-schema`). To rebuild:

1. Verify Jest/ESLint/tsc are green for the changed package FIRST — dist output is never a validation signal.
2. `npx lerna run build --stream` in MetaEd-js (EXCEPTIONAL packaging step — allowed only to feed `npm pack`).
3. `npm pack --pack-destination <ide>\local-tarballs` from each package directory.
   The tarball set must be dependency-closed over `@edfi/metaed-*` (check every packed package.json).
4. Wire `file:` refs + overrides, `npm install`, then **audit package-lock.json**: every entry whose
   package NAME starts with `@edfi/metaed` must resolve from `local-tarballs/`, none from a registry.
   Critical because the registry may have the SAME semver WITHOUT the local changes.
5. `npm run build` in vscode-metaed-ide (its own repo workflow — fine to run) so the Dev Host launches,
   and confirm the fix is physically present, e.g.:
   `ls node_modules/@edfi/metaed-odsapi-deploy/dist/task/`
6. This wiring is temporary. NEVER commit it; revert (git checkout package.json package-lock.json,
   delete local-tarballs/) when smoke testing ends.

### 0b. Smoke environment at `C:\Temp\metaed-smoke\`

See its `README.md`. If missing, recreate:

- `deploy-target\Ed-Fi-ODS\` and `deploy-target\Ed-Fi-ODS-Implementation\Application\EdFi.Ods.Extensions.<Project>\`
  for EVERY extension project to be deployed (Sample, TPDM) — `ExtensionProjectsExists` fails the deploy otherwise.
- `ed-fi-model-4.0\`, `ed-fi-model-6.0\`: copy from `vscode-metaed-ide\node_modules\@edfi\` (copies, so
  builds never write into node_modules). Pairings: DS 4.0 ↔ targets 6.1/6.2; DS 6.0 ↔ target 7.3.
- `sample-extension\`: package.json with `metaEdProject { projectName: "Sample", projectVersion: "1.0.0" }`,
  one DomainEntity, one Descriptor, self-contained (no core references → builds against any DS).
- `tpdm\`: copy of `packages/metaed-plugin-edfi-api-schema/test/integration/tpdm-project` (TPDM-Core 1.1.0,
  DS 4.0-compatible).
- Three workspace files (`smoke-6x-sample`, `smoke-7x-sample`, `smoke-6x-tpdm`.code-workspace) with settings
  `metaed.targetOdsApiVersion`, `metaed.odsApiDeploymentDirectory` → deploy-target, `metaed.acceptedLicense: true`.
- **Pre-validate each workspace pairing headless** before any IDE run:
  `node packages/metaed-console/dist/index.js --config <cfg> --accept-license true`
  (config format: see `packages/metaed-console/metaed-edfi-*.json`). A project that doesn't build
  masquerades as a deploy failure.

## Phase 1 — The one-window rule (read this to the user)

The #1 failure mode of this protocol (hit twice in the original run): **Build/Deploy executed in the
wrong Extension Development Host window.** All Dev Host windows look alike, and `code
--extensionDevelopmentPath` FOCUSES an existing Dev Host instead of opening the requested workspace.

Protocol:
1. Before each workspace switch, have the user close ALL Extension Development Host windows and confirm.
2. Launch exactly one:
   `code --extensionDevelopmentPath="<ide>" "C:\Temp\metaed-smoke\<workspace>.code-workspace"`
   (`<ide>` = your vscode-metaed-ide checkout, e.g. `C:\Temp\vscode-metaed-ide`)
3. Have the user confirm the title bar shows the intended workspace name and the Explorer shows the
   intended model folder (`ed-fi-model-4.0` vs `ed-fi-model-6.0`) before clicking anything.
4. After every Build, Claude verifies which target actually ran:
   `grep -o '"odsApiVersion"[^,]*' <project>/MetaEdOutput/<Namespace>/ApiMetadata/ApiModel-EXTENSION.json`
   Never trust the success notification alone.

## Phase 2 — Test matrix

Before the first deploy: baseline `find deploy-target -type f` (expect skeleton only or known prior state).
After every deploy: verify with fresh file listings AND timestamps (`stat -c "%y"` vs `date`) — a stale
tree from a previous run is indistinguishable from a fresh one by names alone.

### S1 — Deploy 6.1 (workspace: smoke-6x-sample, target 6.1)
User: Build, then Deploy. Claude verifies:
- `EdFi.Ods.Extensions.Sample\Artifacts\{Metadata, MsSql, PgSql, Schemas}` created and populated.
- Deployed set matches `MetaEdOutput/Sample` build output 1:1 for deployable types
  (ApiMetadata→Metadata, Database/*/ODS/Structure→*/Structure/Ods, Interchange+XSD→Schemas; ApiSchema is NOT deployed).
- No 7.x `Versions\` structure.

### S4 — Re-deploy overwrite (same window, no rebuild)
Claude seeds a marker file INSIDE the deployed Artifacts tree, ideally in a subfolder the build does not
generate (e.g. `Artifacts\MsSql\Data\9999-stale-marker.sql`), and saves the pre-deploy file list.
User: Deploy only. Claude verifies: marker gone, file list identical to pre-marker state.

### S2 — Deploy 6.2 (same window)
Claude edits the workspace file's `metaed.targetOdsApiVersion` to `"6.2"` (settings apply live).
User: Build, then Deploy. Claude verifies: same 6.x layout, `odsApiVersion: "6.2"` in build output,
fresh timestamps.

### S3 — Deploy 7.3 regression (workspace: smoke-7x-sample — APPLY THE ONE-WINDOW RULE)
User: Build (DS 6.0 is slow), then Deploy. Claude verifies:
- `EdFi.Ods.Extensions.Sample\Versions\<projVer>\Standard\<dsVer>\Artifacts\...` created.
- 6.x-style `Artifacts\` folder is ABSENT (the deploy's cleanup removes any prior one; V6 tasks must not recreate it at >=7.0.0).
- Expect 7.x output differences: no Interchange/XSD generated, extra scripts like `1460-...AggregateIdColumns.sql`.

### S15 — TPDM on 6.1 (workspace: smoke-6x-tpdm — ONE-WINDOW RULE)
User: Build (TPDM is large), then Deploy. Claude verifies:
`EdFi.Ods.Extensions.TPDM\Artifacts\{Metadata, MsSql, PgSql, Schemas}` populated, `odsApiVersion: "6.1"`.

### Extended (non-blocking, optional): S5–S14

Editor-level scenarios beyond the deploy matrix. Extra one-off setup beyond Phase 0b: S6 needs a
workspace pairing an incompatible DS model with a 6.x target (e.g. `smoke-6x-mismatch.code-workspace`,
ed-fi-model-5.0 + target 6.1); S13 needs the bundled model itself as a workspace folder
(`smoke-6x-bundled.code-workspace`) — read-only protection applies only under the extension's
`node_modules/@edfi`, never to the Phase 0b model copies.

| # | Area | Test | Expected |
| --- | --- | --- | --- |
| S5 | ODS target switching | Switch `metaed.targetOdsApiVersion` 6.1 → 7.3 → 6.1 (DS 4.0 workspace), building each time; Deploy once on the final 6.1 pass | Build succeeds each time — verify each via `odsApiVersion` in build output (Phase 1 step 4). Note: with DS 4.0, Interchange/XSD still generate at target 7.3 — artifact-set differences track DS version, not target |
| S6 | DS/ODS mismatch | Build an incompatible pairing (e.g. DS 5.0 project, target 6.1) | Immediate compatibility error notification ("ODS/API version 6.1 ... requires data standard project ..."); no crash, no build |
| S7 | DS version switching | Build the same extension against ed-fi-model-4.0 (target 6.1), then ed-fi-model-6.0 (target 7.3) — ONE-WINDOW RULE | Both build successfully; DS 6.0 artifact set has no Interchange/XSD |
| S8 | Garbage in a file | Paste invalid text into a `.metaed` file in the extension project | Squiggles + Problems entries with exact line/col ("mismatched input ..."); revert clears them |
| S9 | Validation errors | Remove `documentation`, remove identity, reference a nonexistent entity, duplicate a property name | A distinct parser/validator message in Problems for each |
| S10 | Simple extension build | Extension with one DomainEntity + one Descriptor + one Choice; Build at 6.1 | Build success; `MetaEdOutput/<Extension>/{ApiMetadata, ApiSchema, Database, Interchange, XSD}` generated |
| S11 | License gating | Deploy with `metaed.acceptedLicense` false | "You must first accept the Ed-Fi License Agreement" message; nothing deployed |
| S12 | Missing deploy dir | Deploy with `metaed.odsApiDeploymentDirectory` empty | "To deploy, set Ods Api Deployment Directory under File -> Preferences -> Settings." (`LanguageClient.ts:125` — wording differs from the older QA spreadsheet); nothing deployed |
| S13 | Core file edit protection | With Alliance Mode off, edit a bundled core DS file and save | Intended: warning with override prompt on save. KNOWN BUG [METAED-1670] (found 2026-07-08): `ensureBundledDsReadOnly()` sets no read-only flag — case-sensitive path check at `DataStandardManager.ts:94` vs VS Code's lowercase drive letter — so the save currently succeeds silently. Don't re-file; retest once METAED-1670 is fixed |
| S14 | Delete referenced file | Delete a domain entity file that another file references; Build | Build fails; reference errors in Problems at exact line/col; restoring the file clears them |

## Known benign observations (do not flag as failures)

- Empty `Artifacts\MsSql\Data\Ods\` after 6.x deploys: the build emits an empty
  `Database\SQLServer\ODS\Data\` folder (SQL Server only) and `copySync` faithfully copies it. Same in v4.6.
- No `Data\` SQL files for minimal projects, no InterchangeOrderMetadata for small extensions.
- No core artifacts under `Ed-Fi-ODS\` unless Alliance Mode: `deployCore` = `allianceMode()` in the extension.
- 7.x deploy removes a pre-existing 6.x `Artifacts\` folder: standing `RemoveExtensionArtifacts` behavior (gate >=3.3.0).

## Recording

Record each result (pass/fail, date, evidence one-liner) in the ticket's plan file results table as it
completes, and update the ticket task JSON if one exists.

## Final report (last step, always)

When the run ends, write a standalone results report: `MetaEd-test-result-<month>-<year>.md`
(e.g. `MetaEd-test-result-07-2026.md`) next to the ticket's plan file (or in the working directory
if there is no ticket). Its destination is the Jira ticket as an attachment — it is NEVER committed
to this repo, so keep it out of any commit and remind the user to attach it when the run ends.
It must contain:

- **Run context:** date, `$ARGUMENTS` requested, MetaEd package version / tarball set
  (e.g. `4.7.1-dev.8`), vscode-metaed-ide commit, and the DS model ↔ target pairings used.
- **Results table:** one row per scenario in the requested set — ID, area, result
  (Pass / Fail / Blocked / Skipped), date, evidence one-liner (file counts, paths, `odsApiVersion`
  checks — not just the notification text). Scenarios not run appear as Skipped with the reason;
  never silently omit a row.
- **Bugs found:** links to any tickets filed during the run (per S13's METAED-1670 precedent), and
  which known-benign observations were triggered so they aren't re-investigated later.
- **Cleanup status:** confirm the vscode-metaed-ide wiring was reverted (Phase 0a step 6) — if it
  wasn't, say so explicitly and remind the user before ending the run.
