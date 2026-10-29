# Development Notes

## Build Scripts

Call `npm run` at the command line to identify the available commands.

## Testing

Unit tests for VS Code integration were not deemed worth the effort in this
situation. All of the MetaEd logic is embedded in MetaEd packages that _are_
well tested.

## Dependency auditing

Run `npm audit fix`, then `npm run test:lint` and `npm run package` to
verify dependency updates.

The `@azure/identity` override selects MSAL Node 7.1.2 or later to fix
[GHSA-xcx6-jx8p-x3h5](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5).
Azure Identity 4.14.0 still requests MSAL Node 6.x. MSAL Node 7 removes the
interactive authentication `responseMode` option, which Azure Identity 4.14.0
does not pass. Remove the override when Azure Identity requests a patched
MSAL Node version itself.

As of October 29, 2026, `deepmerge` 4.3.1, pulled in by
`@edfi/metaed-core` 4.8.0, has an unpatched low-severity advisory:
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
Its dependent MetaEd packages also appear in the audit report. The suggested
`npm audit fix --force` downgrades MetaEd to 4.0.0; it does not patch the
current engine. Keep the MetaEd packages in sync and consume an upstream
fix when one is available.

## Release

To create a new release and publish to Visual Studio Marketplace:

1. Update the `version` value in `package.json`.
   * The version string is used as the GitHub release tag and name.
   * Do not prefix the version with `v`.
   * Example: `1.0.0`
2. Merge the version change to `main`.
   * The `Create Pre-Release` workflow creates a GitHub pre-release from the
     `package.json` version.
   * The workflow only runs when package metadata changes, and skips release
     creation if the `package.json` version did not change.
   * The `On Pre-Release` workflow builds the VSIX package and attaches it to
     the pre-release.
3. When ready to release to the Marketplace:
   * Edit the existing release, unchecking the "pre-release" option.

What happens? When a change is merged to `main`, a GitHub Action creates a
pre-release using the package version. With that pre-release, a GitHub Action
runs to build a VSIX package and attaches it to the pre-release. When the
release flag is changed from pre-release to release, a different Action workflow
fires off, downloading the VSIX attachment and publishing it to the Marketplace.

## Optimization

The VSIX package is quite large (around 13 MB). Ideally, this could should be
bundled and minimized for a smaller package. At this time, there is a
fundamental blocker with the way that the MetaEd code loads packages
dynamically: due to this, any "shakedown" of packages will end up culling most
of the packages, since the bundling process will not be able to follow dynamic
code flows at "compile" time.
