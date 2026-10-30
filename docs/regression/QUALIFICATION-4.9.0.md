# MetaEd 4.9.0 qualification — 2026-10-30

Automated IDE regression **passes**: 176 A-case subcases across A01–A16, ten additional
extracted-VSIX checks, SQL Server checks on two representative pairings, and TPDM build/deploy.
All 20 supported DS/ODS build/deploy pairings passed. Full release qualification remains
**incomplete**: actual IDE visual evidence is unavailable, the real ODS code-generator build
is blocked by its dependencies, and IDE 4.9.0 is not yet public on the Marketplace.

## Update and provenance

- Checkout: `/home/brad/work/vscode-metaed-ide`, branch `prep-for-4.9-release`; clean before
  the update. The starting Git revision and environment are in `routine/environment.json`.
- Extension version and all 20 declared MetaEd dependencies changed from `4.8.1-dev.10` to
  exact `4.9.0`. All 22 installed, locked, and packaged MetaEd packages match, including
  API-schema and API-catalog. Dependencies were installed from the configured registry;
  no local source redirection or tarball wiring was used.
- Data Standard declarations and every model-package lock entry are unchanged.
- `npm install`, `npm run test:lint`, `npm run package`, and `git diff --check`: passed.
  This IDE repository has no unit-test suite; engine behavior was exercised through its
  published packages, actual compiled linter, and real IPC language server.
- Qualification-run VSIX (before adding this report): 25,793,418 bytes, 22,585 entries.
  Archived as `qualification-vscode-metaed.vsix` under the evidence root; subsequent local
  packages are built at `extension/vscode-metaed.vsix` and have their own hashes.
  SHA-256: `ceaf0189c2a135b2d26ce088fe3743743519fcbf057625b9fd65187a54521e1a`.
  Inspection verified the compiled client/server/linter, grammar, models, and all dynamically
  loaded MetaEd packages. Extracted-VSIX execution used its own packaged modules.
- Evidence root: `/tmp/metaed-4.9.0-qualification-20261030`.
  `results/results.json` is the combined machine-readable result; `results/report.md` lists
  every executed or blocked subcase. The helper's initial report is partial and is superseded
  where explicitly recorded by the combined results.

## Release matrix

Both DS-only and DS + Sample builds passed for every cell below, followed by semantic
artifact checks and exact source-to-destination hash comparisons for Sample deployment.
The compatibility map was reconciled with `src/client/DataStandardManager.ts` before running.
DS versions here are project versions, not npm package versions.

| DS project | ODS/API targets tested | Result |
| --- | --- | --- |
| 4.0.0 | 6.1, 6.2, 7.1, 7.2, 7.3 | Pass |
| 5.0.0 | 7.1, 7.2, 7.3 | Pass |
| 5.1.0 | 7.1, 7.2, 7.3 | Pass |
| 5.2.0 | 7.1, 7.2, 7.3 | Pass |
| 6.0.0 | 7.1, 7.2, 7.3 | Pass |
| 6.1.0 | 7.1, 7.2, 7.3 | Pass |

These headless runs do not prove client rejection of incompatible combinations. All ten
non-4.0 bundled DS + 6.1/6.2 rejection workspaces are prepared for the visual handoff.

## Automated results

| Cases | Result and evidence |
| --- | --- |
| A01 | Lint, TypeScript, package, version alignment, model-lock preservation, and VSIX content/hash checks pass. |
| A02/A10/A12 | All 20 pairings pass DS-only/Sample builds, artifact checks, and byte-exact deployment with no core or unexpected destination files. |
| A03–A05 | All decimal, string/integer, documentation, parser, optional-bound, and comment mutations pass. |
| A06 | Descriptor documentation/duplication, unresolved common, and missing cardinality diagnostics pass; restoration clears diagnostics. Missing common no longer causes ODS plugin exceptions. |
| A07 | Missing identity, duplicate property, missing association reference, incomplete association, missing interchange member, minimal ABC, and unresolved scalar/collection cases pass without plugin exceptions. Missing domain member produces a warning and permits generation. |
| A08 | Before/after merge builds and invalid merge diagnostics pass. Both metadata relationships and both SQL dialects use one SchoolId identity column. SQL Server catalog checks also confirm both foreign keys share it. |
| A09 | Valid → reversed bounds → restore → delete QaPeer → restore passes in one loaded real linter session, including source ranges and clearing. Deletion also produces the expected nonblocking domain-member warning. |
| A11 | Stale output is removed; entity rename replaces old metadata/table declarations. |
| A13 | Default cleanup, suppress-delete preservation on P1, and old unversioned-tree removal on P4 pass. |
| A14/A15 | P1/P3 core inclusion/exclusion, SQL marker routing, and missing-extension-target failure with unchanged target files pass. |
| A16 | Both P1/P3 pass lint, build, deploy, invalid build, and invalid deploy through real IPC. Invalid deploy returns explicit failure and leaves target hashes and timestamps unchanged. |

A10 parses generated JSON/XML/XSD, checks Sample entities/identities in API metadata/schema
and both SQL dialects, reads the four generated workbooks per pairing, and checks handbook
local links. XSD and interchange artifacts are present across the selected matrix.

A07's dedicated full-generation sequence passes valid → missing member → restored: each build
produces 105 files, diagnostics change from two baseline warnings to three and back to two,
and the QaDomain diagnostic clears in the same linter session. The unresolved member is absent
from resolved domain membership. Evidence: `domain-warning/results.json` and per-build manifests.

Ten additional extracted-VSIX checks cover missing identity, deletion, unresolved scalar and
collection references, same-session clearing, and invalid generation preserving prior output.
Evidence: `packaged-fix-results.json`. This is package execution evidence, not IDE installation proof.

## Model warning baselines

The enabled domain-member validator intentionally reports warnings. Exact message, severity,
file, line, token, and column assertions distinguish these existing model issues from unexpected
diagnostics. Builds continue; no bundled models were edited.

| Model | Existing domain-member issue |
| --- | --- |
| DS4.0 | `Domain/Finance.metaed:19`: `ObjectDimentsion` is misspelled. |
| DS5.0/5.1 | No domain-member baseline warnings. |
| DS5.2 | `Domain/Assessment.metaed:16`: `LearningStandardEquivalenceAssociation` is declared as a domain entity but defined as an Association. |
| DS6.0 | `Domain/Assessment.metaed:55`: `StudentAssessmentEducationOrganizationAssociation` is an Association; `TeachingAndLearning.metaed:112–113` lists `StudentEvaluationElement` and `StudentEvaluationObjective`, which are Commons. |
| DS6.1 | `Domain/TeachingAndLearning.metaed:108–109`: the same two Commons are listed as domain entities. |
| TPDM fixture | `Domain/TeacherPreparation.metaed:9–12`: unqualified `Credential`, `School`, `Staff`, and `StudentGradebookEntry` resolve in TPDM instead of EdFi. |

Initial adapter assertions knew only the DS4.0 and DS6.1 baseline issues. The expanded run
identified the DS5.2/6.0 and TPDM warnings above. Source definitions were inspected, exact
assertions were added, and affected builds/deployments were rerun. The initial results remain
in evidence; corrected matrix results are in `matrix-retry/`. This changed the temporary test
adapter, not product behavior or fixture contents.

## Additional environments

- **X01 Pass, P1 and P3 with QaMerge:** a disposable SQL Server 2025 container executed
  26 and 31 generated SQL scripts respectively, core before extension, including schema,
  tables, foreign keys, indexes, change-query, and ownership scripts. Catalog assertions
  verified Sample tables, identities, primary/foreign keys, unique Id indexes, and shared
  SchoolId merge columns. Evidence: `sql-initial-results.json` (P1), `sql-retry-results.json`
  (P3), and `logs/sql-*.log`. The first P3 attempt lacked sqlcmd `-I`; rerunning with
  QUOTED_IDENTIFIER enabled passed without editing generated SQL. SQL Server emits existing
  maximum-index-key-length warnings on some core tables; this run does not test maximum-length
  data inserts. The container and temporary password were removed after evidence capture.
- **X02 Blocked:** clean copies of matching ODS/Implementation `v7.3.2` revisions were prepared,
  and P3 core/Sample artifacts deployed successfully. Building the real code generator fails
  at NuGet restore with NU1903: MessagePack 3.1.4 advisories are treated as errors. The full
  ODS build/code-generation workflow therefore remains unqualified. No audit suppression or
  ODS dependency changes were applied. See `logs/ods-revisions.json`, `ods-deploy.json`, and
  `ods-codegen.log`; the original ODS checkouts were not modified.
- **X03 Pass:** TPDM-Core 1.1.0 + Sample with DS4.0/ODS6.1 generated 125 files and deployed
  all 64 mapped extension files exactly, excluding core. Fixture source is MetaEd-js
  `packages/metaed-plugin-edfi-api-schema/test/integration/tpdm-project` at
  `acd9a125bc03ac638815bc990ff922d105ddb488`. See `tpdm-results.json` and `tpdm/` manifests.
- **X04 Blocked until publication:** the live Marketplace gallery API reported 4.8.0 as the
  newest IDE version on this run. Verify the [public listing](https://marketplace.visualstudio.com/items?itemName=Ed-FiAlliance.vscode-metaed-ide)
  and package after IDE 4.9.0 is published; response retained in `logs/marketplace.json`.

## Visual handoff and cleanup

All V01–V14 remain Blocked: 97 explicitly listed visual variants lack the required IDE proof.
Native desktop control and supplied screenshots/recordings are unavailable. V10's Windows
path/protection check and V12 additionally require Windows/Excel. V14 requires publication.
No mocked VS Code calls or headless success were counted as visual passes.

The [metaed-regression skill](/home/brad/.codex/skills/metaed-regression/SKILL.md) requires:
“If no native desktop control or supplied proof is available, mark V cases Blocked and provide
concise human steps.” The handoff is `visual/HANDOFF.md` under the evidence root. It includes
isolated-profile VSIX launch commands, all supported and incompatible pairings, negative
project/deployment workspaces, exact edit/restore instructions, diagnostic evidence, and screenshot
locations. Follow [VISUAL.md](VISUAL.md) for every variant. License acceptance starts false.

All automated fixture mutations were restored and pristine hashes verified. Temporary SQL
infrastructure was removed. Only `package.json`, `package-lock.json`, and this report changed
in the IDE checkout. No production code, engine checkout, or bundled model changes were made;
no extension installation, publication, commit, or push was performed during this qualification run.
