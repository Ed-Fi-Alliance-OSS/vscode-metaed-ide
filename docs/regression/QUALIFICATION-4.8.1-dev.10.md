# MetaEd 4.8.1-dev.10 qualification — 2026-10-29

The published API-schema fix passes automated qualification, including the real compiled linter
loaded from the generated VSIX. The complete routine regression **does not pass**: five subcases
fail on existing defects, and IDE visual evidence is still blocked.

## Update and provenance

- Checkout: `/home/brad/work/vscode-metaed-ide`, branch `prep-for-4.9-release`, base commit
  `f5ea5dd2b26be56b19d0aae2d081507cded66ebf`. The checkout was clean before this update; its two existing local commits were preserved.
- Extension version and all 20 declared MetaEd dependencies: `4.8.1-dev.10`.
  All 22 resolved MetaEd packages, including API-schema and API-catalog, match that version.
- Data Standard declarations and every model-package lock entry are unchanged.
- Node `v26.12.1`, npm `11.20.0`; linux 6.14.0-37-generic x64.
- `npm install`, `npm run test:lint`, and `npm run package`: passed. Package inspection verified
  compiled client/server, language grammar, bundled models and dynamically loaded plugins.
- VSIX: `/home/brad/work/vscode-metaed-ide/extension/vscode-metaed.vsix`
  (25,788,003 bytes), SHA-256 `851731d047af0ef50907a4cf6a30193edce753d5f9c9915faeaa746213b250d5`.
- Raw evidence and temporary adapters: `/tmp/metaed-dev10-qualification-20261029`. `combined-results.json` is authoritative for
  this run; the skill helper's `routine/results/REPORT.md` describes only its initial partial coverage.

## Fixed behavior

- A09 passes valid → reversed bounds → repair → delete QaPeer → restore, in one real linter session.
  Deletion reports the missing domain-entity reference on `Association/QaLink.metaed`, line 5,
  columns 17–22. Restoration sends an empty diagnostic array for that same URI.
- A07 missing identity, original minimal `ABC`, and unresolved scalar/collection references return
  actionable diagnostics without API-schema exceptions. Valid restoration succeeds.
- Ten additional checks use the compiled linter and engine from the extracted VSIX, with no module
  redirection. They cover deletion/restoration, missing identity/restoration, scalar and collection
  references/restoration, and invalid generation with `stopOnValidationFailure: false`. The failed
  generation preserves an existing output marker and writes no new files.
- The published plugin contract enables `requiresValidModel` for API-schema, handbook, and catalog.
- A comparison against isolated published `4.8.1-dev.9` reproduces its API-schema exceptions for
  missing identity and scalar/collection references, which are absent in `dev.10`.

## Routine agent results

86 passing and 5 failing automated subcases across A01–A16, plus ten passing
packaged-fix checks. Counts include the helper's partial artifact rows and the subsequent complete
semantic checks; they are subcase counts, not distinct requirements. Baseline-comparison runs are
excluded from qualification totals.

| Cases | Result |
| --- | --- |
| A01 | Lint, package, version/VSIX-content checks pass. |
| A02/A10/A12 | P1–P4 pass DS-only and Sample builds, semantic artifact checks, and byte-exact extension deployment. |
| A03–A05 | Decimal, string/integer and documentation/parser mutations pass, including valid omitted optional bounds and comments. |
| A06 | Descriptor/cardinality checks pass; unresolved common fails with ODS-plugin exceptions. |
| A07 | Identity, duplicate-property, missing entity, association structure, scalar/collection references and minimal ABC checks pass. Missing domain/interchange members fail as described below. |
| A08 | Valid before/after merge builds pass. Both references map to one SchoolId identity column in metadata/SQL. Invalid merge produces the expected diagnostic. |
| A09 | Same-session diagnostic appearance and clearing pass. |
| A11 | Rebuild removes stale output; renamed entity replaces old metadata/table declarations. |
| A13 | P1 deletion/suppression and P4 old unversioned tree removal pass. |
| A14/A15 | P1/P3 core inclusion/exclusion, additional SQL routing and missing-extension-target handling pass. |
| A16 | Valid IPC lint/build/deploy and invalid-build notifications pass; invalid deploy fails on P1 and P3. |

A10 parses all generated JSON/XML/XSD, checks Sample entities and identities in API metadata/schema
and both SQL dialects, inspects cells in the four generated workbooks, and checks handbook local
links. Deployment checks use disposable directory skeletons; they do not establish a working ODS
installation or database schema.

## Remaining failures

| Case | Observation | Baseline evidence |
| --- | --- | --- |
| A06 missing common | `MissingCommon` gives the expected diagnostic, then `edfiOdsRelational` throws on `odsProperties`; downstream ODS plugins throw on `tableName`. | Reproduces in isolated dev.9. Its additional API-schema exception is removed in dev.10. |
| A07 missing domain member | `QaDomain` referencing `MissingRecord` produces no diagnostic and returns success. | Same result in dev.9. |
| A07 missing interchange member | Expected validation error plus an `edfiXsd` exception reading `xsdMetaEdNameWithExtension`. | Same XSD exception in dev.9. |
| A16 P1 | Invalid build is followed by deploy success; 30 existing target files are recopied. | Previously observed on dev.9; IDE server source is unchanged. |
| A16 P3 | Invalid build is followed by deploy success; 28 existing target files are recopied. | Previously observed on dev.9; IDE server source is unchanged. |

Target hashes remain identical in the A16 failures; changed timestamps prove stale files were
recopied. These findings were recorded without changing product code or relaxing expected behavior.
No Jira issues or comments were created.

Two temporary adapter assertions were corrected and rerun: a one-reference association yields an
EOF/parser error expecting a second `domain entity`, and DS6.1 uses BIGINT for SchoolId. Initial and
corrected evidence is retained; these were harness assumptions, not product failures.

## Visual and external coverage

V01–V11 and V13 are **Blocked**: native IDE interaction/visual evidence is unavailable in this
session. Extracted-VSIX execution is not proof of installation, activation, highlighting, squiggles,
notifications, or responsiveness. V07/V08 remain required to complete visual qualification of this fix.
V12 is Blocked without Windows/Excel. V14 and X04 are Skipped because this is an unpublished IDE
prerelease qualification, not Marketplace release qualification. X01–X03 are Skipped: database,
real ODS-build, and TPDM qualification are outside this run. The full release matrix was not run.

Use `/tmp/metaed-dev10-qualification-20261029/visual/HANDOFF.md` for isolated-profile launch commands, exact edits,
expected messages, screenshot names, and restoration steps. Prepared workspaces include P1–P4,
N1, empty/missing/multiple-DS and malformed-project variants, and deployment-path variants.

All automated fixture mutations were restored. Only the dependency/version files and this report
were changed in the checkout. No extension installation, publication, commit, or push was performed.
