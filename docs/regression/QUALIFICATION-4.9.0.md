# MetaEd 4.9.0 automated qualification — 2026-11-02

**Automated A01–A16 qualification passes on commit `495c156`.** This run includes the
API 8.1 compatibility change and removal of Ramda memoization. There are 218 passing
A-case result rows, 18 additional extracted-VSIX checks, two supplemental client contract
checks, three SQL Server pairings, and one TPDM build/deploy check. All **23 supported
DS/ODS pairings** pass DS-only builds, Sample builds, artifact inspection, and deployment.

**Full release qualification remains incomplete.** The real ODS code-generator build is
blocked by NuGet restore advisories, and public Marketplace 4.9.0 checks must follow
publication. V01–V14 were skipped because this request was for automated qualification;
no headless or stubbed-host result is counted as visual evidence.

This report supersedes the October 30 report for the current checkout. Every pass below
comes from fresh execution; prior results were not carried forward.

**Release sign-off update — 2026-11-02:** Brad confirmed that automated qualification
and IDE visual/install checks passed. The visual/install confirmation is separate from
the automated run documented here; this report does not contain its screenshots or
per-case results. The X02 dependency blocker recorded below remains, and public
Marketplace/update checks (X04/V14) follow publication.

## Provenance and evidence

- Checkout: `/home/brad/work/vscode-metaed-ide`, branch `prep-for-4.9-release`, commit
  `495c156` (`Add API 8.1 target and replace Ramda memoization`); clean at run start.
- Extension, all 20 declared MetaEd dependencies, and all 22 installed/locked/packaged
  MetaEd packages are exactly `4.9.0`. Installed dependencies matched the lockfile;
  no installation, local tarball wiring, or dependency changes were needed.
- Environment: Linux x64, kernel `6.14.0-37-generic`, Node `26.12.1`, npm `11.20.0`;
  installed VS Code `1.144.0`. This was a CLI run, not an IDE session or the Node 20 CI runner.
- `npm run test:lint` and `npm run package`: passed. Packaged client/server/linter,
  grammar, bundled models, dynamic plugins, API 8.1 setting, and versions verified.
- VSIX: 25,252,558 bytes, 21,892 entries; SHA-256
  `c3407a24a280ab7d5e7c9460544937948c5ab770f084d8bb18a99748ffc0536c`.
- Evidence root: `/home/brad/work/metaed-qualification-20261102`.
  [Combined report](/home/brad/work/metaed-qualification-20261102/results/report.md),
  [machine-readable results](/home/brad/work/metaed-qualification-20261102/results/results.json),
  [environment](/home/brad/work/metaed-qualification-20261102/matrix/environment.json), and
  [archived VSIX](/home/brad/work/metaed-qualification-20261102/qualification-vscode-metaed.vsix).
  Logs, temporary adapters, fixture hashes, diagnostics, and artifact/deployment manifests
  remain under this directory, outside the repository.

## Release matrix

Each cell includes DS-only and DS + Sample generation, semantic artifact checks, and exact
mapped source/destination hashes with no core or unexpected deployment files.
DS versions below are project versions, not npm package versions.

| DS project | ODS/API targets tested | Result |
| --- | --- | --- |
| 4.0.0 | 6.1, 6.2, 7.1, 7.2, 7.3 | Pass |
| 5.0.0 | 7.1, 7.2, 7.3 | Pass |
| 5.1.0 | 7.1, 7.2, 7.3 | Pass |
| 5.2.0 | 7.1, 7.2, 7.3, 8.1 | Pass |
| 6.0.0 | 7.1, 7.2, 7.3, 8.1 | Pass |
| 6.1.0 | 7.1, 7.2, 7.3, 8.1 | Pass |

## Automated results

| Cases | Result and evidence |
| --- | --- |
| A01 | Lint/TypeScript, VSIX build/content, and declared/installed/locked/packaged version alignment pass. |
| A02/A10/A12 | All 23 pairings pass. JSON and XML/XSD parse; metadata/schema and both SQL dialects contain Sample entities and identity; all four workbooks contain QaRecord; handbook content and local file references are checked. Deployment matches all mapped source hashes and excludes core. |
| A03–A05 | Decimal, string/integer, optional bounds, documentation, quotation, and comment mutations produce expected diagnostics or a valid result. Each mutation is restored and Sample diagnostics clear in the same loaded linter. |
| A06/A07 | Descriptor documentation/duplication, unresolved common, missing cardinality/identity, duplicate property, association structure/reference, interchange member, and minimal ABC checks pass without unexpected plugin exceptions. Missing domain membership warns, permits generation, is absent from resolved membership, and clears after repair. |
| A08 | Before/after merge builds pass; invalid merge fails with the relevant diagnostic. Metadata and both SQL dialects map CourseOffering and Location through one SchoolId column. SQL Server catalog checks confirm two foreign keys share that column. |
| A09 | Valid → reversed decimal → repair → delete QaPeer → repair passes in one real linter session, including exact decimal range, referencing-file diagnostics, domain warning, and clearing. |
| A11 | Successful rebuild removes stale output; renamed entity replaces complete old declarations in metadata and SQL. |
| A13 | P1 default cleanup removes the stale marker and suppression preserves it. P4 removes the old unversioned Artifacts tree and writes exact versioned output. |
| A14/A15 | P1/P3 core inclusion/exclusion, dialect-specific additional scripts, and useful missing-extension failure with unchanged target hashes/timestamps pass. |
| A16 | Real IPC on P1/P3 passes lint, build, deploy, invalid build, and invalid deploy. Failed builds return explicit deployment failure and leave target hashes and timestamps unchanged. |

The extracted VSIX uses its own packaged dependencies for 13 selected validation/recovery
checks and five real IPC checks. These 18 passes prove package execution, not installation
or real IDE interaction.

Two supplemental probes load the actual packaged `DataStandardManager.js` with a stubbed
VS Code host. They verify all 36 compatibility combinations (23 accepted, 13 rejected),
API 8.1's `ed-fi-model-6.1` recommendation, retry after an unsuccessful extension lookup,
and caching after a successful lookup. These do **not** satisfy V04 or V10.

Initial temporary-harness assertions were corrected for actual parser `UNSIGNED_INT`
wording and synthetic `<EOF>` ranges, SQL Server's CREATE TABLE terminator, and cyclic engine
objects (recording resolved member names instead). Affected checks were rerun successfully;
initial and corrected results are retained. No product code changed to obtain passes.

## Model warning baselines

Warnings were matched against expected tokens, severity, validator, and source locations;
they do not mask unexpected errors or prevent generation. No model source changed.

| Model | Expected domain-member warning tokens |
| --- | --- |
| DS4.0 | ObjectDimentsion |
| DS5.0/5.1 | None |
| DS5.2 | LearningStandardEquivalenceAssociation |
| DS6.0 | StudentAssessmentEducationOrganizationAssociation, StudentEvaluationElement, StudentEvaluationObjective |
| DS6.1 | StudentEvaluationElement, StudentEvaluationObjective |
| TPDM fixture | Credential, School, Staff, StudentGradebookEntry; plus the DS4.0 baseline |

## Additional environments and remaining qualification

- **X01 Pass:** disposable SQL Server 2025 executed generated core/extension schema, tables,
  foreign keys, indexes, change-query, and ownership scripts: 26 scripts on P1, 31 on P3
  with QaMerge, and 29 on DS6.1/ODS8.1. Catalog assertions verify Sample identity columns,
  primary/foreign keys, unique Id indexes, and merged SchoolId relationships.
  See `results/sql.json` and `logs/sql-*.log`.
- **X02 Blocked:** fresh isolated copies of ODS and Implementation `v7.3.2` were used.
  ODS revision `e489317ea77f245aff99d57374165c238848f9a0`; Implementation revision
  `8b5ccf9b2f64dce214db0e364eada267822af4d7`. Building `EdFi.Ods.CodeGen.csproj` fails
  restore because MessagePack 3.1.4 advisories raise NU1903 errors. No audit suppression
  or ODS dependency changes were applied. Full ODS build/code-generation remains unqualified.
  See `logs/ods-codegen.log`.
- **X03 Pass:** TPDM-Core 1.1.0 + Sample on DS4.0/ODS6.1 generates 125 files and deploys
  all 64 mapped extension files byte-for-byte, excluding core. Fixture source: MetaEd-js
  `v4.9.0`, revision `3aac07bdbf3f72fa1c13bc1e7b9d369cdc1464bd`,
  `packages/metaed-plugin-edfi-api-schema/test/integration/tpdm-project`.
  See `results/tpdm.json` and expected/actual manifests.
- **X04 Blocked until publication:** live `vsce show` reports Marketplace version 4.8.0.
  Verify the public listing and package after 4.9.0 is published; the response is retained
  in `logs/marketplace.json`.
- **V01–V14 Skipped for this automated-only request:** this run did not collect real IDE
  visual evidence; see the separate release sign-off above. V10's Windows path/protection case and V12 require Windows/Excel;
  V14 requires publication. The [visual handoff](/home/brad/work/metaed-qualification-20261102/visual/HANDOFF.md)
  references all 23 supported workspaces and 27 additional setup/negative workspaces,
  including all 13 incompatible pairings. Follow [VISUAL.md](VISUAL.md).

## Cleanup

All 27 copied fixture trees match their pristine hashes. The disposable SQL container was
removed, and test language servers exited. Existing ODS checkouts, installed extensions,
bundled models, source code, package declarations, and lockfile were not modified.
Only this qualification report changed in the repository. No commit, push, or publication
was performed.
