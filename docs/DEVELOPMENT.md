# Development Notes

## Build Scripts

Call `npm run` at the command line to identify the available commands.

## Testing

Unit tests for VS Code integration were not deemed worth the effort in this
situation. All of the MetaEd logic is embedded in MetaEd packages that _are_
well tested.

## Release

To create a new release and publish to Visual Studio Marketplace:

1. In GitHub, create a new release:
   * _as a pre-release_
   * Using a version number string prefixed with 'v' and corresponding to the
     value in the `package.json` file.
   * Example: `v1.0.0`
   * Do not use pre-release type nomenclature when _intending_ to publish to the
     Marketplace. Can label as pre-release if only intending for user to
     download the VSIX from GitHub, not from the Marketplace.
   * Use the change log button to auto-generate a change log.
2. When ready to release to the Marketplace:
   * Edit the existing release, unchecking the "pre-release" option.

What happens? With a pre-release, a GitHub Action runs to build a VSIX package
and attaches it to the pre-release. When change away from pre-release, a
different Action workflow fires off, downloading the VSIX attachment and
publishing it to the Marketplace.

## Optimization

The VSIX package is quite large (around 13 MB). Ideally, this could should be
bundled and minimized for a smaller package. At this time, there is a
fundamental blocker with the way that the MetaEd code loads packages
dynamically: due to this, any "shakedown" of packages will end up culling most
of the packages, since the bundling process will not be able to follow dynamic
code flows at "compile" time.
