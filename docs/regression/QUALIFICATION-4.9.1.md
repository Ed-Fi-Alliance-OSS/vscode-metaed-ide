# MetaEd IDE 4.9.1 documentation-only qualification — 2026-11-04

The reduced pre-publication qualification in [PLAN.md](PLAN.md#documentation-only-patch-qualification)
passes. Extension version 4.9.1 retains MetaEd engine 4.9.0 and the same six bundled Data
Standard models. This is documentation and extension version metadata only.

## Provenance

* Repository: `vscode-metaed-ide`, branch `docs/release-notes-4.8-4.9`.
* Starting commit: `79094beb7983e2de3eecfdd8ed51f98915e62197`, initially clean. Checks ran
  with the 4.9.1 version, README, and qualification-policy edits in the working tree.
* Environment: Linux x64, kernel 6.14.0-37-generic; Node 26.12.1; npm 11.20.0;
  VS Code 1.144.0 (`2c33b50b16c472efe58357d1d2a8a5414bc23fbf`).
* Evidence retained outside the repository: environment metadata, command logs, comparison
  results, verification scripts, and both VSIX files. Evidence filenames below are relative
  to that collection.
* Baseline: `vscode-metaed.vsix` downloaded from the published GitHub release `4.9.0`.
  SHA-256: `51aa5d1ad42424a86eb742fb8069d2392d18d20e40d5c77ab7aa493fd684871b`.
* Candidate: `vscode-metaed-4.9.1.vsix` in the evidence directory, also built at
  `extension/vscode-metaed.vsix`; 25,204,042 bytes and 21,882 entries.
  SHA-256: `d350155f16dc2225aac929681d03ef8bacf029d2e9cb2f56d767b03422f95d59`.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Documentation-only eligibility | Pass | Source, settings, dependencies, and packaging configuration match tag `4.9.0`. Package and lockfile differences are only the extension's root version values. Installed dependency versions match the lockfile. See `environment.json`. |
| A01 lint and packaging | Pass | `npm run test:lint` and `npm run package` both exited 0. See `logs/lint.log` and `logs/package.log`. |
| VSIX inspection | Pass | ZIP integrity, manifest version 4.9.1, packaged README, compiled client/server/linter, grammar, 22 MetaEd packages at 4.9.0, and all six models verified. Repository guidance and regression docs remain excluded. See `package-inspection.json`. |
| Published-package comparison | Pass | No added or removed entries. Exactly three changed files: `extension.vsixmanifest`, `extension/package.json`, and `extension/readme.md`. Manifest and package changes are version-only; all 21,879 other entries are byte-for-byte identical. See `vsix-comparison.json`. |
| Isolated CLI installation | Pass | Installed 4.9.0, upgraded to 4.9.1, verified version listing, uninstalled and verified absence, reinstalled 4.9.1, and verified its listing and installed contents. See `install-results.json` and `logs/`. |
| A02–A16, V01–V13, X01–X03 | Skipped | Runtime contents are unchanged; excluded under the documentation-only scope. No new functional, activation, or visual regression passes are claimed. |
| X04/V14 | Blocked until publication | Version 4.9.1 is not yet public. Verify the Marketplace version, README rendering, links, and actual IDE update after publication. |

Installation used only the evidence directory's `user-data/` and `extensions/` directories.
The installed extension is under `extensions/ed-fialliance.vscode-metaed-ide-4.9.1` there.
No development host or regular user installation was used for these checks.

Two inspection assumptions were corrected: vsce rewrites the README's existing relative
license link using `blob/HEAD`, and VS Code adds `__metadata` to installed `package.json`.
After accounting for those transformations, the packaged README matches the source, installed
package fields match the VSIX, and the inspected installed README and compiled files match
their packaged bytes. No product changes were needed.

The final workflow-built VSIX should receive the same content checks before promotion; its
archive hash may differ because of packaging timestamps. Publication and Marketplace checks
are separate from this completed local qualification.
