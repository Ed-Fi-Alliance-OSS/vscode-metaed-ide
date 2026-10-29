# MetaEd IDE regression test plan

This plan checks the current checkout and its installed MetaEd packages. It replaces the
manual sequence in METAED-1658 with independent, repeatable scenarios and explicit evidence.
It is a test specification, not a claim that the scenarios pass or an installed test runner.

- [Agent instructions](AGENT.md): prepare fixtures, run headless checks, collect evidence.
- [Visual instructions](VISUAL.md): exercise the real IDE and capture specific visible results.

## Scope and evidence

**A cases** can be executed by an agent with command-line access. **V cases** require visual
evidence from a real VS Code session. An agent with desktop control can collect that evidence;
otherwise a human operates the IDE. Headless output, source inspection, mocked VS Code APIs,
and a tester saying “it worked” do not establish a V pass.

**X cases** are agent-executable checks requiring additional environments or a published
release. Their prerequisites are explicit below. Windows/Excel behavior has its own visual case.

Use `Pass`, `Fail`, `Blocked`, or `Skipped` for each case, subcase, and matrix row. A missing
prerequisite is Blocked; an intentionally excluded scope is Skipped with a reason. An unexpected
plugin exception is a failure even if the expected diagnostic also appears. Preserve the expected
diagnostic and exception as separate observations. Never inherit old QA results as new passes.

For each result record: case/subcase ID, pair ID, timestamp, fixture revision/hash, action,
expected result, actual result, status, and evidence paths. Record the checkout commit, dirty
state, package and installed dependency versions, DS **project** versions, Node/npm, OS,
VS Code version, and whether the IDE used a development checkout or installed VSIX.

An agent run is complete when every selected A/X row has a result. A complete routine regression
requires all routine A and V rows to pass. Blocked visual rows mean the combined run is incomplete.
Known issues retain Fail status and a ticket reference; they are not automatic exemptions.

## Version matrix

Resolve versions from the checkout at run time. The starting baseline is MetaEd `4.8.1-dev.9`.
The following pairs reflect `DataStandardManager.ts` and the settings in `package.json` when
this plan was written. DS versions below are model project versions, not npm package versions.

| Pair | DS | ODS/API target | Purpose |
| --- | --- | --- | --- |
| P1 | 4.0.0 | 6.1 | 6.x generation and unversioned deployment |
| P2 | 4.0.0 | 6.2 | Other supported 6.x target |
| P3 | 6.1.0 | 7.3 | Latest bundled DS and versioned deployment |
| P4 | 4.0.0 | 7.3 | Hold DS constant while switching target families |
| N1 | 6.1.0 | 6.1 | Client must reject an incompatible pairing |

Routine scope: A01 once; A02/A10/A12 on P1–P4; validation A03–A09 on P3;
A11 on P3; A13 on P1 and P4; A14–A16 on P1 and P3. V rows specify their pairs.
N1 is a client check in V04, not a test of a direct engine call bypassing compatibility checks.

For a release or compatibility-map change, expand build/deploy coverage to all supported
pairings: DS 4.0 with targets 6.1/6.2, and each bundled DS (4.0, 5.0, 5.1, 5.2, 6.0, 6.1)
with 7.1/7.2/7.3. Also reject each non-4.0 bundled DS with 6.1/6.2 in the client. Reconcile
this list with the checkout before running. Routine coverage does not certify this full matrix.
Release validation also includes V13 and X04/V14 once the release is public. Include V12 for
Windows/Excel coverage, X01 when SQL generation changes, and X02 when qualifying ODS deployment.
If required infrastructure is unavailable, report that qualification as incomplete.

## Fixtures and isolation

Use a run directory outside the checkout containing `fixtures/`, `workspaces/`, `output/`,
`deploy/`, `logs/`, `screenshots/`, and `results/`. Keep pristine fixtures and make a new copy
for each independent mutation. Give IDE workspaces names containing the run ID and pair ID.
Copy DS models from the installed packages. Never edit the originals for ordinary tests.
Use `output/<pair>/<case>/MetaEdOutput` for headless generation: the engine requires
`MetaEdOutput` in an existing output path before it will replace that directory on rebuild.

The Sample project has the following package metadata:

```json
{"metaEdProject":{"projectName":"Sample","projectVersion":"1.0.0"}}
```

Create the following `.metaed` files, with the indicated paths. Indentation is significant to
readability; retain line breaks so expected diagnostic locations can be determined before execution.

`DomainEntity/QaRecord.metaed`:

```text
Domain Entity QaRecord
  documentation "Regression record."
  integer QaRecordId
    documentation "Record identifier."
    is part of identity
  common QaDetail
    documentation "Record detail."
    is optional
  descriptor QaCategory
    documentation "Record category."
    is optional
```

`DomainEntity/QaPeer.metaed`:

```text
Domain Entity QaPeer
  documentation "Regression peer."
  integer QaPeerId
    documentation "Peer identifier."
    is part of identity
```

`Common/QaDetail.metaed`:

```text
Common QaDetail
  documentation "Regression detail."
  string Value
    documentation "Detail value."
    is required
    max length 64
```

`Descriptor/QaCategory.metaed`:

```text
Descriptor QaCategory
  documentation "Regression category."
```

`Association/QaLink.metaed`:

```text
Association QaLink
  documentation "Regression link."
  domain entity QaRecord
    documentation "Linked record."
  domain entity QaPeer
    documentation "Linked peer."
```

`Domain/QaDomain.metaed`:

```text
Domain QaDomain
  documentation "Regression domain."
  domain entity QaRecord
  domain entity QaPeer
  association QaLink
  footer documentation "Regression footer."
```

`Interchange/QaInterchange.metaed`:

```text
Interchange QaInterchange
  documentation "Regression interchange."
  extended documentation "Regression interchange details."
  use case documentation "Exchange regression records."
  domain entity QaRecord
  association QaLink
```

`Shared/QaDecimal.metaed`, `Shared/QaString.metaed`, and `Shared/QaInteger.metaed`, respectively:

```text
Shared Decimal QaDecimal
  documentation "Regression decimal."
  total digits 9
  decimal places 3
  min value 0
  max value 100
```

```text
Shared String QaString
  documentation "Regression string."
  min length 1
  max length 20
```

```text
Shared Integer QaInteger
  documentation "Regression integer."
  min value 0
  max value 100
```

For A08 add `DomainEntity/QaMerge.metaed` to a fresh Sample copy:

```text
Domain Entity QaMerge
  documentation "Regression merge."
  domain entity EdFi.CourseOffering
    documentation "Course offering."
    is part of identity
  domain entity EdFi.Location
    documentation "Course location."
    is part of identity
```

First build that fixture. Then add `merge CourseOffering.School with Location.School` under
the CourseOffering property after its cardinality. This declares both references missing from
the old TC32 instructions. Keep before/after fixture copies.

Additional workspaces: no folders; Sample only; DS only; two DS folders; valid DS plus a folder
without `package.json`; malformed metadata variants; N1; and a workspace pointing into the
**disposable extension installation's bundled model** for V10. Set workspace-level
`metaed.targetOdsApiVersion`, `metaed.odsApiDeploymentDirectory`, `metaed.allianceMode: false`,
and `metaed.suppressDeleteOnDeploy: false`. Record license acceptance explicitly; V03 needs
the setting false before it is accepted. Put DS first and Sample last, so IDE output goes under
Sample's `MetaEdOutput` directory.

Create a separate deployment skeleton per pair:

```text
deploy/<pair>/Ed-Fi-ODS/
deploy/<pair>/Ed-Fi-ODS-Implementation/Application/EdFi.Ods.Extensions.Sample/
```

A directory skeleton proves file deployment only. It is not a working ODS/API installation.
Do not reuse `MetaEdOutput` from the Jira ZIP as fresh output or treat it as a golden baseline.
The ZIP's sample projects are historical end states of sequential edits; use them for extra
coverage only after isolating a scenario and checking its prerequisites.

## Agent-executable cases

Each semicolon-separated mutation below is a separate subcase, reset to its valid seed first.
Match diagnostic meaning, severity, file, and relevant source range. Record exact text, but do
not require obsolete parser token lists or hard-coded user paths from the old spreadsheet.

| ID | Action | Required result and evidence |
| --- | --- | --- |
| A01 | Run `npm run test:lint` and `npm run package`; inspect VSIX contents. | Commands succeed; compiled client/server, grammar, bundled DS models, and dynamically loaded MetaEd plugins are packaged. Save logs and VSIX hash. |
| A02 | Build DS alone, then DS + pristine Sample, on each routine pair. | No validation errors or plugin exceptions; successful pipeline result; fresh artifacts. Record both subcases. |
| A03 | QaDecimal: valid seed; lowercase declaration name; remove documentation; min 101/max 100; decimal places 10/total digits 9; nonnumeric min/max; remove decimal places; remove total digits; remove either bound. | Seed and omitted bounds succeed. Other mutations produce the corresponding syntax or decimal validation error at the edited declaration. |
| A04 | QaString: min 21/max 20; negative min/max length; omit max; omit min. QaInteger: min 101/max 100; nonnumeric min/max; omit either bound. | String reversed/negative lengths and omitted max fail; omitted min succeeds. Integer reversed/nonnumeric bounds fail; omitted bounds succeed. Integer bounds are values, not string lengths. |
| A05 | On QaInteger: remove documentation; omit a quote; use single quotes; insert unescaped inner quotes; add a `//` comment. | Documentation mutations produce parser errors; the comment does not. |
| A06 | Remove QaCategory documentation; add a second identical descriptor declaration; rename QaRecord's common reference to MissingCommon; remove the Value property's cardinality. | Relevant documentation, duplicate declaration, unresolved common, and cardinality errors. Restore each and verify clear diagnostics. |
| A07 | Remove QaRecord identity (change to `is required`); duplicate QaRecordId property; reference MissingRecord from QaLink; remove QaLink's second entity; reference MissingRecord from QaDomain and QaInterchange separately. | Identity, duplicate property, association reference/structure, and interchange reference mutations produce errors. The missing domain entity member in QaDomain produces a **warning** at the MissingRecord reference and permits a successful build; restore QaRecord and verify that warning clears in the same linter session. No unexpected exceptions. Also run the original minimal `Domain Entity ABC` with `documentation ""` to retest the observed API-schema exception. |
| A08 | Build the explicit QaMerge fixture before/after adding the merge; then replace `Location.School` with `Location.MissingSchool`. | Both valid versions build. Merged metadata/SQL consistently map both references to one School identity column. Invalid merge fails with a relevant diagnostic. Save the model/SQL comparison; the unmerged fixture may already share a SQL column, so a changed column count is not required. |
| A09 | Lint valid Sample; introduce A03 reversed bounds; restore; delete QaPeer while QaLink references it; restore. Run in the same linter session. | Correct file/range/severity; nonempty diagnostics on error; empty diagnostics published for previously failing files after repair. Deleted-reference errors appear on the referencing file. No stale diagnostics remain. |
| A10 | Inspect every A02 Sample output. | JSON/XML parse; Sample entities and identities appear in API metadata/schema and SQL; QaRecord appears in applicable dictionaries and handbook; handbook index references existing files. Check content, not just file counts. Record artifact manifest and hashes. |
| A11 | In generated output add a uniquely named stale file; rebuild. Rename QaPeer to QaPeerRenamed, update its references in QaLink and QaDomain, and rebuild again. | Stale output is removed; metadata/SQL describe QaPeerRenamed and no longer declare the old QaPeer entity/table. No stale files survive a clean successful build. Match complete names, not substrings of the new name. |
| A12 | Deploy a fresh successful Sample build with `deployCore=false`. | Deployment succeeds; required files are copied to the correct version layout and match source bytes. No core files are deployed. A success flag with no copied files fails. |
| A13 | P1: redeploy with a stale marker under `Artifacts/MsSql/Data/`, first with suppress-delete false, then true. P4: seed an old unversioned `Artifacts` tree, then deploy with suppress-delete false. | P1 default removes marker; suppression preserves it while updating generated files. P4 removes the old unversioned tree and writes versioned output. Do not assume arbitrary stale files inside a 7.x versioned tree are purged. |
| A14 | Fresh targets: compare `allianceMode=false, deployCore=false` with `allianceMode=true, deployCore=true`. | First run leaves core target untouched; second deploys matching core artifacts as well as Sample. Verify correct 6.x/7.x core layouts. |
| A15 | Supply distinct harmless `.sql` marker files through both additional-script directories; then deploy to a target missing the Sample project directory. | Markers arrive byte-for-byte only in their respective `MsSql/Data/Ods` and `PgSql/Data/Ods` locations. Missing extension directory returns a useful failure and leaves target files unchanged. |
| A16 | Through the real language server transport, request lint, build, and deploy. Then invalidate the fixture and request build/deploy against a target containing a prior valid deployment. | Diagnostics and completion notifications arrive, process stays alive, and valid operations match A02/A12. Failed build reports failure. **Required failure behavior:** invalid input must not deploy stale artifacts or report deploy success. Compare target hashes and timestamps before/after; any mutation or success after failed build is a defect. |

A07 domain entity membership is intentionally nonblocking while bundled models contain mistyped
members. On DS6.1, `Domain/TeachingAndLearning.metaed` lists `StudentEvaluationElement` and
`StudentEvaluationObjective` as domain entities although both are commons. Record those baseline
warnings separately; they must not prevent building or mask the appearance and clearing of the
Sample warning. Unresolved members remain absent from the resolved domain membership. Keep the
error expectations for association and interchange references. This warning contract requires an
engine with the domain-member validator enabled; published `4.8.1-dev.10` still lacks the diagnostic.

A16 deliberately tests the failure path through `LanguageServer.ts`, not a harness that adds
its own successful-build guard. The current source calls deployment after the build result;
do not weaken the expected behavior to make that implementation pass.

For A10, establish a version-specific list of required artifact families before assertions.
For the starting checkout include API metadata/schema, both SQL dialects, dictionaries,
handbook, and XSD/Interchange output applicable to the fixture. Do not copy the older smoke
guide's blanket “no XSD/Interchange for newer DS” expectation: the preliminary DS6.1/7.3 build
on `4.8.1-dev.9` generated these artifacts. If the generator contract changes, document the
supported change before revising assertions. Absence alone is not evidence that an artifact
became optional. UDM output remains deferred until its current supported format is specified.

Deployment roots beneath `Ed-Fi-ODS-Implementation/Application/EdFi.Ods.Extensions.Sample`:

| Target | Extension artifact root | Core artifact root beneath `Ed-Fi-ODS/Application/EdFi.Ods.Standard` |
| --- | --- | --- |
| 6.1/6.2 | `Artifacts/` | `Artifacts/` |
| 7.x | `Versions/1.0.0/Standard/<formatted DS version>/Artifacts/` | `Standard/<formatted DS version>/Artifacts/` |

Resolve the formatted DS version using the installed package's documented formatting function
and configuration; record the resolved value. Source-to-target mapping: `ApiMetadata` →
`Metadata`; `Database/SQLServer/ODS/{Data,Structure}` → `MsSql/{Data,Structure}/Ods`;
PostgreSQL equivalents → `PgSql`; `Interchange` and `XSD` → `Schemas`. `ApiSchema` is generated
but is not copied by this ODS deployment mapping. Compare manifests after applying this mapping.
An empty SQL Data directory or absent data scripts for a minimal model is not itself a failure.

## Visual cases

The exact actions and required screenshots/recordings are in [VISUAL.md](VISUAL.md).
Run routine cases V01–V11. V12–V14 are conditional and must be explicitly reported.

| ID | Visible behavior | Pairs |
| --- | --- | --- |
| V01 | Activation, language mode/highlighting, editor actions, command palette | P3 |
| V02 | Empty workspace, missing DS, multiple DS, malformed project metadata | P3 setup variants |
| V03 | License gating and settings changes | P3 |
| V04 | Valid target switching and incompatible pairing rejection | P1 → P4 → P1, P3, N1 |
| V05 | Empty, missing, and incorrectly structured deployment directory | P3 |
| V06 | Successful build and visible fresh output | P1–P4 |
| V07 | Parser/validator errors, source navigation, repair and clearing | P3 |
| V08 | Referenced file deletion/restoration and workspace add/remove | P3 |
| V09 | Deploy notifications, overwrite, and failure presentation | P1–P4; failure on P3 |
| V10 | Bundled core save protection and Alliance Mode behavior | P3; Windows for path-casing regression |
| V11 | Settings persistence, reload, repeated build/deploy | P3 |
| V12 | Windows Excel file locks and recovery | P3, Windows with Excel |
| V13 | Packaged installation, disable/enable, uninstall/reinstall | P3, isolated VS Code profile |
| V14 | Published extension discovery and update presentation | Release validation only |

## Additional environments

| ID | Prerequisites and action | Required result |
| --- | --- | --- |
| X01 | Disposable SQL Server database and supported client. Execute generated schema, table, and index scripts in dependency order, core before extension. | SQL executes successfully; catalog inspection confirms Sample tables, identities, keys, and merged columns. Capture queries/results. A file parse is not a database test. |
| X02 | Matching ODS/API and Implementation revisions, documented build tools, and disposable configured database. Deploy and run that release's documented build/code-generation workflow. | Build succeeds and generated API resources/schema include Sample. Record repo revisions, commands, database type, and logs. Directory-skeleton deployment is not sufficient. |
| X03 | Versioned TPDM fixture with compatible DS and all extension project directories. Build/deploy using its documented pairing. | All expected TPDM artifacts are freshly generated and deployed; no silent omissions. Record fixture source/revision. |
| X04 | Published release and expected version. Inspect Marketplace description, version, links, and VSIX metadata. | Listing and package match the intended public release. Record URL/time; leave actual IDE update presentation to V14. |

## Changes from the old QA suite

Sources: [METAED-1658](https://edfi.atlassian.net/browse/METAED-1658), including
[MetaEd-QA - DS 6.1.xlsx](https://edfi.atlassian.net/rest/api/3/attachment/content/35931),
[TestCases.zip](https://edfi.atlassian.net/rest/api/3/attachment/content/35929), and
[QA Results-2594.docx](https://edfi.atlassian.net/rest/api/3/attachment/content/35930).
The ticket points to [METAED-1662](https://edfi.atlassian.net/browse/METAED-1662) for QA updates.
This plan also uses the repository's [deploy-smoke protocol](../../.claude/deploy-smoke/SKILL.md)
as historical deployment evidence; its local-tarball prerequisites apply only when testing
unpublished engine changes, not routine checks of this checkout's declared packages.

| Original cases | Replacement / disposition |
| --- | --- |
| TC01–02 | X04 and V14; public-release checks separated from prerelease testing. |
| TC03–06 | V01, V11, V13–V14. Reinstall is not expected to erase VS Code settings. |
| TC07 | V01. Editor title actions are expected for `.metaed` files, not every file. |
| TC08–10, TC16 | V02/V04. Exactly one compatible DS; DS6.1 is not compatible with ODS6.1. |
| TC11–14 | V03/V05. Exercise Deploy where the old step incorrectly said Build; use current wording. |
| TC15, TC20, TC24 | A02/A10 and V01/V06/V08; project import and generation checked separately. |
| TC17–18 | A14/V10; bundled file protection needs actual bundled paths and visual proof. |
| TC19, TC21–22 | A06/A09 and V02/V08. Malformed project folders block a build; they are not silently ignored. |
| TC23, TC25–27 | A03–A05 and V07. Correct integer value semantics; remove obsolete literal parser expectations. |
| TC28–31, TC33 | A06/A07/A10 and V07. Use complete references and explicit diagnostic expectations. |
| TC32, TC34 | A07/A08/A09 and V07; explicit merge fixture replaces missing prerequisite steps. |
| TC35 | A10/A11, X01, V06/V12. Split model edits, artifact contents, SQL execution, and Excel locks. |
| TC36–37 | A12–A16, V09, X02. Replace unsupported DS3.2/ODS3.4 and ODS6.0 pairs with the supported matrix. |

Deferred legacy subcases: numeric MetaEd-ID uniqueness (TC23/25/26/30), Shared Short/short,
inline common and common-in-domain/interchange assertions, descriptor map-type details,
`is weak`, subclass identity renaming, and UDM output. The old materials contain uncertainty,
missing examples, or missing expected results for these features. Do not silently mark them
Pass or infer removal from the language. Before promoting any, establish a complete fixture,
supported DS range, and explicit expectation from current engine tests/specification; add an
independent row. They are not included in the routine pass claim.

Historical findings to retest, not assumptions about current status:

- Bundled-file save protection: [METAED-1670](https://edfi.atlassian.net/browse/METAED-1670),
  referenced by the earlier smoke guide. Preserve OS/path details in V10.
- TC36/37 reported successful deploy clicks without artifacts. A12/V09 require disk evidence.
- A preliminary `4.8.1-dev.9` run on 2026-10-29, commit `6fe6e89`, returned the expected missing
  identity diagnostic but also logged an API-schema tracked-change-key exception. A07/A16
  must retain exception evidence; no ticket or resolved status is assumed.

## Report and cleanup

Write `results/report.md` plus machine-readable rows, logs, fixture hashes, output/deployment
manifests, and V evidence. Include scope, pair coverage, failed assertions, exceptions, blocked
prerequisites, deferred coverage, and links to evidence. Report A and V totals separately.

Restore all mutated fixtures/settings and bundled-file contents/permissions in the disposable
installation. Close only test processes/windows. Preserve evidence and remove temporary targets
only after recording results. Compare final Git status with the initial status; do not undo user
changes. Do not post Jira comments, upload results, publish, or commit as part of executing this plan
unless separately instructed.
