# Prevent API-schema exceptions while linting invalid MetaEd models

## Objective

Deleting a referenced entity must produce the existing missing-reference diagnostic without
an API-schema or dependent-plugin exception. Lint must continue collecting diagnostics from
other plugins, and restoring the entity must clear the diagnostic and resume normal processing.

Implement the engine change in **MetaEd-js**, then consume its published packages in this
repository. This document is an implementation plan; the production fix has not been applied.

## Confirmed cause and proposed behavior

The issue was reproduced with installed MetaEd packages `4.8.1-dev.9`, DS `6.1.0`, and ODS/API
target `7.3`. The [regression plan](docs/regression/PLAN.md) supplies the Sample fixtures.
Deleting `DomainEntity/QaPeer.metaed` leaves `Association/QaLink.metaed` referencing it.

The reference resolver leaves `referencedEntity` as the `NoTopLevelEntity` sentinel, whose
`data` object has no `edfiApiSchema`. Validation correctly reports the missing reference.
However, `src/server/Linter.ts` uses `runEnhancers: true`, `runGenerators: false`, and
`stopOnValidationFailure: false`. Processing reaches
`JsonSchemaForInsertEnhancer.schemaObjectForReferentialProperty`, which dereferences
`property.referencedEntity.data.edfiApiSchema.apiMapping` and throws.

A guard at that single dereference would leave similar assumptions in later schema enhancers.
An in-memory experiment also showed that skipping only API-schema enhancement causes the
handbook enhancer to fail: it uses API-schema property naming metadata. Skipping API-schema,
handbook, and API-catalog enhancement preserved the missing-reference diagnostic and eliminated
pipeline exceptions for this fixture. The valid fixture still succeeded.

That experiment only bypassed enhancement. It did **not** implement the plugin contract,
generator gating, failure result, or output protection described below. Those require tests.

## 1. Prepare the upstream change

- [ ] Locate the intended MetaEd-js checkout; the checkout inspected during diagnosis was
  `/home/brad/work/dms-root/MetaEd-js`. Read its current `AGENTS.md` and working-tree status.
- [ ] Reconfirm the pipeline and plugin contracts against that revision. Keep unrelated local
  changes intact and record the revision and installed package versions used for reproduction.
- [ ] Reproduce the deleted-reference case with the real default plugin pipeline and lint
  options. Capture `validationFailure`, `pipelineFailure`, logged exceptions, and the result's
  `failure` field. Preserve a valid baseline and a restored-model run.

Paths in sections 2–5 are relative to the **MetaEd-js root**.

## 2. Add an explicit valid-model requirement to the plugin contract

- [ ] In `packages/metaed-core/src/plugin/MetaEdPlugin.ts`, add:

  ```ts
  /**
   * Skip this plugin's enhancers and generators when validation errors exist.
   * Validators still run.
   */
  requiresValidModel?: boolean;
  ```

- [ ] Set `requiresValidModel: false` in `newMetaEdPlugin()`. Treat an omitted field as false
  so existing plugin initializers remain compatible.
- [ ] Document that the requirement concerns artifact processing. It does not suppress the
  plugin's validators or request that the entire pipeline stop.

## 3. Enforce the requirement at the pipeline boundary

- [ ] Update `packages/metaed-core/src/pipeline/Pipeline.ts` inside the plugin loop.
  Preserve the existing validator execution and `stopOnValidationFailure` early-exit logic.
- [ ] After that logic, but before either enhancement or generation, add the equivalent of:

  ```ts
  const hasValidationErrors: boolean = state.validationFailure.some(
    (validationFailure) => validationFailure.category === 'error',
  );

  if (metaEdPlugin.requiresValidModel && hasValidationErrors) {
    failure = true;
    Logger.debug(
      `Skipping ${metaEdPlugin.shortName} enhancers and generators because validation errors exist`,
    );
    continue;
  }
  ```

- [ ] Check the accumulated validation errors at each plugin boundary, including errors from
  earlier plugins and any errors the current plugin's validators added.
- [ ] Continue running subsequent plugins, including their validators. Leave processing of
  plugins without the requirement unchanged.
- [ ] Keep the result failed once a plugin is skipped for invalid input. Verify that the
  existing final output-writing guard prevents files from being written or replaced.
- [ ] Treat warnings as nonblocking. Do not add a duplicate validation diagnostic for the
  skip, swallow unexpected exceptions, or create placeholder schema metadata on the sentinel.

## 4. Opt in the producer and its consumers

- [ ] Set `requiresValidModel: true` in these initializers:

  | File | Reason |
  | --- | --- |
  | `packages/metaed-plugin-edfi-api-schema/src/index.ts` | Schema construction requires resolved references and valid identities. |
  | `packages/metaed-plugin-edfi-handbook/src/index.ts` | Handbook enhancement calls API-schema naming helpers that require initialized property metadata. |
  | `packages/metaed-plugin-edfi-api-catalog/src/index.ts` | Catalog generation reads API-schema namespace and resource metadata. |

- [ ] Recheck direct imports and indirect helper usage for any additional consumers at the
  implementation revision. Apply the same requirement to a newly identified consumer only
  when its dependency warrants it.
- [ ] Confirm the three listed plugins still have no validators. If they have gained validators,
  verify those validators can execute independently of the skipped artifact metadata.

## 5. Prove the contract and regression behavior upstream

- [ ] Add focused core pipeline tests using controlled plugins and invocation tracking:

  | Scenario | Required assertions |
  | --- | --- |
  | Earlier validation error, continue-on-error enabled | Opted-in plugin validators run; its enhancers and generators do not; later validators run; original diagnostics remain; result is failed. |
  | Error from the opted-in plugin's own validator | Its artifact processing is skipped and subsequent validators still run. |
  | Valid model or warning-only diagnostics | Opted-in enhancers/generators execute normally when their corresponding pipeline options are enabled. |
  | Requirement omitted or false | Existing continue-on-error processing remains unchanged. |
  | `stopOnValidationFailure: true` | Existing early-stop behavior remains intact. |
  | Invalid input with generators enabled | Result is failed; no fresh output is written, and a pre-existing output marker/hash remains unchanged. |

- [ ] Add an integration regression using the real default plugin sequence and lint options.
  Place it in the upstream integration suite that can exercise all default plugins without
  introducing circular production-package dependencies. Use isolated temporary model files.
- [ ] Run valid → delete QaPeer → restore QaPeer with a fresh engine state per execution.
  Assert the specific missing-reference validation on deletion, no `pipelineFailure` entries,
  and no unexpected exception logs. After restoration, assert clean validation and successful
  API-schema/handbook processing rather than merely the absence of exceptions.
- [ ] Cover unresolved scalar and collection references and a missing-identity model. Establish
  that each seed is valid before mutation; match the specific expected diagnostic for each.
- [ ] Exercise the real compiled IDE linter during integration qualification to verify that
  previously published diagnostics clear in the same linter session.
- [ ] Run existing API-schema, handbook, and catalog tests, including:
  `packages/metaed-plugin-edfi-api-schema/test/enhancer/JsonSchemaForInsertEnhancer.test.ts`
  and the `ApiSchemaAuthoritativeCompare_v7_1`, `_v7_2`, and `_v7_3` integration tests.
  Valid-model artifacts should remain unchanged; investigate differences before changing
  authoritative expectations.
- [ ] Follow upstream guidance: invoke individual tests with `npx jest <test-file>` from the
  root and run directory-level ESLint and `tsc --noEmit` for changed packages. Do not run
  `npm run build` in MetaEd-js merely for development validation.

## 6. Consume and qualify the fix in vscode-metaed-ide

- [ ] After corrected packages are published through the normal upstream release process,
  update this extension's version and all declared `@edfi/metaed-*` versions in lockstep.
  Regenerate the lockfile using the repository's normal dependency workflow and verify the
  resolved core, API-schema, handbook, and catalog versions. Leave `@edfi/ed-fi-model-*`
  versions unchanged.
- [ ] Keep `src/server/Linter.ts` configured to continue after validation errors. Do not add
  permanent unit tests to this IDE repository or duplicate the engine fix here.
- [ ] Run `npm run test:lint` and `npm run package`; retain logs and the VSIX hash.
- [ ] Follow [AGENT.md](docs/regression/AGENT.md) and the routine matrix in
  [the regression plan](docs/regression/PLAN.md). Require A09 deletion/restoration to pass
  without unexpected exceptions, and repeat the relevant A07 missing-identity case.
  Verify valid builds/artifacts across P1–P4, including handbook and API-schema content.
- [ ] Collect V07/V08 evidence using [VISUAL.md](docs/regression/VISUAL.md): the reference error
  appears at the correct location after deletion, clears after restoration, and the IDE
  remains responsive. Report missing visual evidence as Blocked.
- [ ] For release qualification, run the expanded coverage required by the regression plan
  and `AGENTS.md`. The bundled regression skill's partial runner alone is insufficient.

## Acceptance and scope

- [ ] Invalid references yield the existing actionable diagnostics with no API-schema or
  dependent-plugin exception; later validation continues.
- [ ] Skipped artifact processing produces a failed pipeline result and writes no output.
- [ ] Valid and warning-only inputs retain their existing processing and artifact contents.
- [ ] Restoring the model resumes artifact processing and clears IDE diagnostics.
- [ ] Upstream tests, IDE checks, and applicable regression evidence are recorded with exact
  versions and any blocked or skipped coverage.

The separate server defect that deploys stale artifacts after a failed build remains outside
this change. Report it independently if A16 reproduces it; this plan does not claim to fix it.
Publishing packages, creating releases, and posting Jira updates are separate actions from
implementing and locally validating this plan.
