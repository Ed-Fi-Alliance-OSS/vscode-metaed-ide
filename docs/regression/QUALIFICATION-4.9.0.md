# MetaEd 4.9.0 automated qualification — 2026-11-02

**Automated A01–A16 qualification passes on commit `1b0d976`.** This fresh run includes
the deploy exception/completion fixes, bundled-model lookup and permission guards, and
compatibility recommendations. There are 218 passing A-case result rows, 18 additional
extracted-VSIX checks, ten supplemental client/IPC checks, three SQL Server pairings,
and one TPDM build/deploy check. All **23 supported DS/API pairings** pass DS-only
builds, Sample builds, artifact inspection, and deployment.

**Full release qualification remains incomplete.** The real ODS code-generator build is
blocked by NuGet restore advisories, and public Marketplace 4.9.0 checks must follow
publication. V01–V14 are Blocked for this run: native desktop control and current
screenshots/recordings were unavailable. No headless or stubbed-host result is counted
as visual evidence.

This report supersedes the November 2 qualification of `495c156` and the October 30
report. Every pass below comes from fresh execution; prior results were not carried forward.

**Historical sign-off — 2026-11-02:** Brad previously confirmed automated qualification
and IDE visual/install checks passed before `1b0d976`. That confirmation is retained as
history, not current visual evidence for the subsequent fixes. This report contains no
new IDE screenshots or per-case visual passes. Prioritize V04, V09, V10, and V11 for
compatibility, deployment notifications/recovery, and bundled-file protection.

## Provenance and evidence

- Checkout: `/home/brad/work/vscode-metaed-ide`, branch `prep-for-4.9-release`, commit
  `1b0d976e669cb7689fdf968846b2de9a7eebb92f` (`some-fixes`); clean at run start.
- Extension, all 20 declared MetaEd dependencies, and all 22 installed/locked/packaged
  MetaEd packages are exactly `4.9.0`. Installed dependencies matched the lockfile;
  no installation, local tarball wiring, or dependency changes were needed.
- Environment: Linux x64, kernel `6.14.0-37-generic`, Node `26.12.1`, npm `11.20.0`;
  installed VS Code `1.144.0`. This was a CLI run, not an IDE session or the Node 20 CI runner.
- `npm run test:lint` and `npm run package`: passed. Packaged client/server/linter,
  grammar, bundled models, dynamic plugins, API 8.1 setting, and versions verified.
- Qualified VSIX: 25,243,316 bytes, 21,890 entries; SHA-256
  `fffa8b23630be78ef245baeeef776662778b18825c7f51ec76ec9ad83265cf53`.
- Subsequent fresh package at `extension/vscode-metaed.vsix`: same size and entry count;
  SHA-256 `7cbe055c3629ea10448c4ca520314e1d6fc534f6db7d85f1ead165a2b600b50f`.
  ZIP integrity passed and every entry's extracted bytes match the qualified VSIX.
  The archive hash differs, but its contents are identical. This package was built
  before this documentation update; it contains the earlier qualification document.
- Evidence root: `/home/brad/work/metaed-qualification-20261102-1b0d976`.
  [Combined report](/home/brad/work/metaed-qualification-20261102-1b0d976/results/report.md),
  [machine-readable results](/home/brad/work/metaed-qualification-20261102-1b0d976/results/results.json),
  [environment](/home/brad/work/metaed-qualification-20261102-1b0d976/matrix/environment.json), and
  [archived VSIX](/home/brad/work/metaed-qualification-20261102-1b0d976/qualification-vscode-metaed.vsix).
  Logs, temporary adapters, fixture hashes, diagnostics, and artifact/deployment manifests
  remain under this directory, outside the repository.

## Release matrix

Each cell includes DS-only and DS + Sample generation, semantic artifact checks, and exact
mapped source/destination hashes with no core or unexpected deployment files.
DS versions below are project versions, not npm package versions.

| DS project | Ed-Fi API targets tested | Result |
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
| A16 | Real IPC on P1/P3 passes lint, build, deploy, invalid build, and invalid deploy. Deploy sends one deployComplete, no buildComplete, and a completion log. Failed builds return explicit deployment failure and leave target hashes and timestamps unchanged. |

The extracted VSIX uses its own packaged dependencies for 13 selected validation/recovery
checks and five real IPC checks. These 18 passes prove package execution, not installation
or real IDE interaction.

Ten supplemental checks cover the current fixes:

- Five packaged-client checks use the actual `DataStandardManager.js` and
  `ServerMessageFactory.js` with a stubbed VS Code host. All 36 compatibility combinations
  produce 23 accepted configurations and 13 rejections, including API 8.1's `>=5.2.0`
  requirement and `ed-fi-model-6.1` recommendation. Range/recommendation fallbacks pass.
- Repeated missing-extension lookups return no root, leave workspace permissions unchanged,
  report one lookup-error toast, and recover/cache after a successful lookup. Missing-root
  messages contain neither `undefined` nor an empty model recommendation.
- Real `chmodr` checks on disposable files produce `0444` files and `0555` directories
  only inside the bundled root; ordinary workspace and sibling-prefix paths remain writable.
  Windows casing, other drives, and parent traversal pass a `node:path.win32` simulation.
  This is not native Windows filesystem or IDE save-protection evidence.
- Five packaged-server IPC checks cover an injected build Error, a non-Error build throw,
  an injected deploy Error, a malformed deploy message, and subsequent successful recovery
  through the real build/deploy pipeline. Failures complete explicitly, log completion,
  send no duplicate buildComplete, preserve target hashes/timestamps, and keep the server alive.
  Fault injection intercepts dependency calls only at requested throw points; the packaged
  language server is unchanged.

These probes do **not** satisfy the visual V cases. See `results/client-contract.json`,
`results/fault-ipc.json`, and `results/fault-wire.json` under the evidence root.

The temporary helper was adapted to read the new compiled compatibility map and assert
the intentionally changed deploy notification contract. One A08 assertion counted a
PRIMARY KEY line as another SchoolId column. The precise column/FK/metadata check was
rerun against fresh output and passed; SQL catalog checks independently confirm the
shared column. Initial and corrected evidence remains in `results/operations.json` and
`results/merge-proof.json`. No product code changed to obtain passes.

The generated handbook embeds its model data. Its index files have no local `href`/`src`
file links; the A10 link check does not establish any additional linked-file coverage.

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
- **X02 Blocked:** a new build attempt used fresh isolated copies of the previously
  archived ODS and Implementation `v7.3.2` sources, excluding `bin`/`obj` output.
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
- **X04 Blocked until publication:** this run's fresh `vsce show` query reports Marketplace version 4.8.0.
  Verify the public listing and package after 4.9.0 is published; the response is retained
  in `logs/marketplace.json`.
- **V01–V14 Blocked:** native desktop control and current screenshots/recordings were
  unavailable. The historical sign-off above does not establish visual passes for this commit.
  V10's Windows path/protection case and V12 require Windows/Excel; V14 requires publication.
  The [visual handoff](/home/brad/work/metaed-qualification-20261102-1b0d976/visual/HANDOFF.md)
  references all 23 supported workspaces and 27 additional setup/negative workspaces,
  including all 13 incompatible pairings. Follow [VISUAL.md](VISUAL.md).

## Cleanup

All 28 copied fixture trees match their pristine hashes. Disposable permission fixtures
were restored, the disposable SQL container was removed, and test language servers exited.
Existing ODS checkouts, installed extensions, bundled models, source code, package
declarations, and lockfile were not modified. The checkout stayed clean through qualification
and the subsequent VSIX build; only this qualification report changed in the documentation
update. No commit, push, or publication was performed.
