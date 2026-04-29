# Development Notes

## Build Scripts

Call `npm run` at the command line to identify the available commands.

## Testing

Unit tests for VS Code integration were not deemed worth the effort in this
situation. All of the MetaEd logic is embedded in MetaEd packages that _are_
well tested.

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
