# vscode-metaed-ide

This is the MetaEd IDE as a Visual Studio Code extension.

## About MetaEd

MetaEd is a technology framework that uses an [Ed-Fi-aligned domain specific
language](https://techdocs.ed-fi.org/x/kBSAAw) (DSL) to auto-generate software,
database, and data standard artifacts.

The Visual Studio extension supports MetaEd development by providing an
integrated development environment that supports:

* Linting (detecting and flagging errors)
* Running the MetaEd build process
* Running the MetaEd deploy process

This application can be used by both the core Ed-Fi Data Standard team as well
as all community members who are developing extensions.

## Extension Settings

* **Target Ods Api Version**: The target Ed-Fi ODS/API version.
* **Target Data Standard Version**: The target Ed-Fi Data Standard version. Must
  match an ODS/API version that supports the given data standard.
* **Ods Api Deployment Directory**: Full path to root folder for the Ed-Fi ODS /
  API source code. The folder this points to should contain Ed-Fi-ODS and
  Ed-Fi-ODS-Implementation folders.
* **Suppress Delete on Deploy**: Stop deployment from deleting the
  SupportingArtifacts API folder. For advanced users only.
* **Telemetry Consent**: Select whether you are willing to submit anonymous
  usage information to the Ed-Fi Alliance servers. Broadly, we send things like
  performance metrics and exceptions, allowing us to more easily triage any bugs
  encountered in the field.
* **Data Standard Project Directory**: Full path to the set of core MetaEd files
  for the Ed-Fi Data Standard. 💡 Set automatically by the ODS/API
  version.
* **Accepted License**: Usage of the MetaEd IDE requires acceptance of the Ed-Fi
  License agreement. Check the box to accept the license terms.
* **Alliance Mode**: For Alliance users only, this makes core files editable.
  Non-Alliance users must leave this setting disabled to avoid dangerous and
  costly mistakes. (warning) Alliance mode users: manually update the "Data
  Standard Project Directory" to the correct folder path to the active
  Ed-Fi-Model repository.

## Issues

Please report support issues in [Ed-Fi Tracker](https://tracker.ed-fi.org).

## Release Notes

### 4.0.0

Supports MetaEd 4.0; first version on Visual Studio Code. For more details, see
[What's New](https://techdocs.ed-fi.org/x/gBOAAw) in Tech Docs.

## Legal

Copyright © 2023, [Ed-Fi Alliance, LLC](https://www.ed-fi.org).

Please see [LICENSE.md](LICENSE.md) for full details of the Ed-Fi License
Agreement.
