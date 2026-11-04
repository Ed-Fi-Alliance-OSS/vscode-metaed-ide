# MetaEd IDE

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Ed-Fi-Alliance-OSS/vscode-metaed-ide/badge)](https://securityscorecards.dev/viewer/?uri=github.com/Ed-Fi-Alliance-OSS/vscode-metaed-ide)

![MetaEd IDE: Ed-Fi Extensions Made
Easy](https://github.com/Ed-Fi-Alliance-OSS/vscode-metaed-ide/blob/main/static/MetaEd-About-Background.png?raw=true)

## About MetaEd

MetaEd is a technology framework that uses an [Ed-Fi-aligned domain specific
language](https://docs.ed-fi.org/reference/metaed) (DSL) to auto-generate software,
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

## Target Ed-Fi API Versions

The IDE settings include a dropdown for selecting the target Ed-Fi API version.
Versions 6.1–7.3 target the Ed-Fi ODS/API, and 8.1 targets Ed-Fi API 8.1.
MetaEd will indicate if there is an Ed-Fi API version and Data Standard model
mismatch in a lower-right notification. The notification will include the
bundled location of the correct Data Standard model.

## Extension Settings

Open File -> Preferences -> Settings and search on "metaed" to find these
settings:

* **Target Ods Api Version**: The target Ed-Fi API version.
* **Ods Api Deployment Directory**: Full path to root folder for the Ed-Fi 
  ODS/API source code. The folder this points to should contain Ed-Fi-ODS and
  Ed-Fi-ODS-Implementation folders. Note: If Ed-Fi-ODS and
  Ed-Fi-ODS-Implementation folders are directly under a Drive(Example: C:, D:) 
  then make sure to include path separating character at the end(C:\, D:\). 
* **Suppress Delete on Deploy**: Stop deployment from deleting the
  SupportingArtifacts API folder. For advanced users only.
* **Accepted License**: Usage of the MetaEd IDE requires acceptance of the
  Ed-Fi License agreement. Check the box to accept the license terms.
* **Alliance Mode**: For Alliance users only, this makes core files editable.
  Non-Alliance users must leave this setting disabled to avoid dangerous and
  costly mistakes.

## Issues

Please report support issues through the [Ed-Fi Community Hub](https://community.ed-fi.org).

## Release Notes

### 4.9.1

Updates release notes and clarifies Ed-Fi API target versions. No functional changes.

### 4.9.0

* Adds Ed-Fi API 8.1 as a target, requiring Data Standard 5.2 or later.
* Improves handling of invalid models: reports validation errors without
  cascading artifact-generation failures, and prevents deployment when the
  preceding build fails. Deployment exceptions now produce a failure notification.
* Adds warnings for unresolved Domain Entity members in domains, and rejects
  property names that conflict with reserved query parameters when targeting
  Ed-Fi API 8.1 or later.
* Shows Build and Deploy toolbar buttons only for MetaEd files. Improves bundled
  Data Standard model lookup, compatibility messages, and read-only protection.
* Adds snapshot headers and responses to generated Ed-Fi API 8 OpenAPI documents.
  Corrects Ed-Fi API 8 ApiSchema namespace authorization metadata to exclude
  Namespace values inside collections.
* Updates dependencies, including security fixes.

### 4.8.0

* Restores core and extension artifact deployment to ODS/API 6.1 and 6.2.
* Adds Ed-Fi API 8 OpenAPI definitions for Change Queries, including deleted records,
  natural key changes, and available change versions.
* Corrects generated Ed-Fi API 8 ApiSchema metadata for choice and optional inline
  common properties, numeric school years, UniqueId query mappings, and equality
  constraints involving merged identity properties.
* Removes underscores from extension OpenAPI operation identifiers for SDK
  generator compatibility.

### 4.7.0

Data Standard 6.1 support.

### 4.6.0

ODS/API 7.3 and Data Standard 6.0 support. Drops support for ODS/API and
Data Standard versions no longer supported by the Ed-Fi Alliance.

### 4.4.0

ODS/API 7.2 and Data Standard 5.1 support. Removed deprecation warnings for
`is queryable only`, `is queryable`, `shorten to`, and the `Short` data type.
Better visibility into Data Standard project locations.

### 4.3.0

ODS/API 7.1 and Data Standard 5.0 final support. Drops support for ODS/API and
Data Standard versions no longer supported by the Ed-Fi Alliance.

### 4.2.0

ODS/API 7.0 and Data Standard 5.0-pre.2 support.

### 4.1.0

"Big" integer support, Drops Data Standard 2.x support.

### 4.0.1

Includes missing plugins for changequery functionality.

### 4.0.0

Supports MetaEd 4.0; first version on Visual Studio Code. For more details,
see [What's New](https://techdocs.ed-fi.org/x/gBOAAw) in Tech Docs.

## Legal Information

Copyright (c) 2025 Ed-Fi Alliance, LLC and contributors.

Licensed under the [Apache License, Version 2.0](./LICENSE) (the "License").

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
