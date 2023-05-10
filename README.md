# MetaEd IDE

![MetaEd IDE: Ed-Fi Extensions Made
Easy](https://github.com/Ed-Fi-Alliance-OSS/vscode-metaed-ide/blob/main/static/MetaEd-About-Background.png?raw=true)

## About MetaEd

MetaEd is a technology framework that uses an [Ed-Fi-aligned domain specific
language](https://techdocs.ed-fi.org/x/kBSAAw) (DSL) to auto-generate software,
database, and Ed-Fi Data Standard artifacts.

The Visual Studio extension supports MetaEd development by providing:

* Linting (detecting and flagging errors)
* Running the MetaEd build process
* Running the MetaEd deploy process

This application can be used by both the core Ed-Fi Data Standard team as well
as all community members who are developing extensions.

## Build and Deploy

The build and deploy actions can be triggered by the buttons at the upper-right
of an open editor tab. Build output will go to a MetaEdOutput folder at the
root of the last folder in the workspace. Any issues with the build will appear
as notifications on the lower-right corner.

## Data Standard Projects

The MetaEd IDE comes bundled with all supported Ed-Fi Data Standard versions.
They are stored along with this Visual Studio Code extension. You must have a
single data standard project in your Visual Studio Code workspace to use the
MetaEd IDE.

A shortcut to finding the location of the Data Standard projects is to trigger
a build without one, either from the upper-right button on an editor tab or via
the Command Palette. Hit Ctrl-Shift-P, start typing "metaed" and select
"MetaEd:Build". This will of course fail, but the error notification in the
lower right will include the file system path of the bundled Data Standard
projects.

## Target ODS/API Versions

The IDE settings include a dropdown for selecting the target ODS/API version.
MetaEd will indicate if there is an ODS/API version and Data Standard model
mismatch in a lower-right notification. The notification will include the
bundled location of the correct Data Standard model.

## Extension Settings

Open File -> Preferences -> Settings and search on "metaed" to find these
settings:

* **Target Ods Api Version**: The target Ed-Fi ODS/API version.
* **Ods Api Deployment Directory**: Full path to root folder for the Ed-Fi 
  ODS/API source code. The folder this points to should contain Ed-Fi-ODS and
  Ed-Fi-ODS-Implementation folders.
* **Suppress Delete on Deploy**: Stop deployment from deleting the
  SupportingArtifacts API folder. For advanced users only.
* **Telemetry Consent**: Select whether you are willing to submit anonymous
  usage information to the Ed-Fi Alliance servers. Broadly, we send things like
  performance metrics and exceptions, allowing us to more easily triage any
  bugs encountered in the field.
* **Accepted License**: Usage of the MetaEd IDE requires acceptance of the
  Ed-Fi License agreement. Check the box to accept the license terms.
* **Alliance Mode**: For Alliance users only, this makes core files editable.
  Non-Alliance users must leave this setting disabled to avoid dangerous and
  costly mistakes.

## Issues

Please report support issues in [Ed-Fi Tracker](https://tracker.ed-fi.org).

## Release Notes

### 4.1.0

"Big" integer support, Drops Data Standard 2.x support.

### 4.0.1

Includes missing plugins for changequery functionality.

### 4.0.0

Supports MetaEd 4.0; first version on Visual Studio Code. For more details,
see [What's New](https://techdocs.ed-fi.org/x/gBOAAw) in Tech Docs.

## Legal

Copyright © 2023, [Ed-Fi Alliance, LLC](https://www.ed-fi.org).

Please see [LICENSE.md](LICENSE.md) for full details of the Ed-Fi License
Agreement.
