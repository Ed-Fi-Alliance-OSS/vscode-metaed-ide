# Visual testing instructions for MetaEd IDE

Use the agent-prepared workspaces and fixtures from [PLAN.md](PLAN.md). The agent handles
setup, exact edit snippets, disk comparisons, and reporting. The tester supplies visible IDE
evidence. Routine scope is V01–V11; V12–V14 require the environments listed below.

## Before testing

1. Open exactly one test Extension Development Host. Before changing workspaces, close all test
   hosts, then use the supplied launch command. Confirm the title, DS folder, Sample folder,
   and target setting match the requested pair. Do not close unrelated work windows.
2. Keep Explorer, the edited file, and Problems visible for validation tests. Use the MetaEd
   Output channel for logs. Save changes unless a step explicitly tests unsaved behavior.
3. Save screenshots as `<case>-<pair>-<action>.png`, or use a short recording for transitions.
   Include the workspace title and relevant file/setting/message. Capture notification history
   if a toast disappears. An error screenshot must show readable message text and source location.
4. Record actual behavior, including unexpected messages. Send evidence to the agent after each
   case. The agent checks files and logs; a success toast alone does not prove build/deploy success.

## Routine checklist

Every listed variant needs a result. One recording may cover several variants if each action and
outcome is identifiable. The agent supplies one-at-a-time fixture edits and restores between them.

| ID | Do this | Required visual proof |
| --- | --- | --- |
| V01 P3 | Open QaRecord, then `package.json`, then close all editors and reopen QaRecord. Open the Command Palette. | MetaEd startup notification/log; MetaEd language mode and distinct keyword/string/comment highlighting. Build/Deploy title actions on `.metaed`, absent on JSON/no editor; `MetaEd: Build` and `MetaEd: Deploy` in the palette. |
| V02 P3 variants | With license accepted: Build in an empty workspace; Sample only; two DS folders; DS + a folder with no `package.json`; DS + malformed JSON; DS + missing project name/version; DS + invalid project name; DS + invalid semver. Restore one DS + valid Sample afterward. | Specific missing/single-DS or project-metadata error and “Nothing to build.” Each invalid variant fails without crashing. A final valid build demonstrates recovery. The agent verifies no output was written for rejected variants. |
| V03 P3 | Set Accepted License false. Run Build and Deploy separately. Inspect Problems. Open the license link, then accept the license in Settings and Build. | Both commands show the license requirement; Problems shows the license diagnostic. Link opens the intended agreement. Setting checked, license diagnostic clears, and accepted build starts. Do not accept terms on another person's behalf. |
| V04 switches | With DS4.0, change target 6.1 → 7.3 → 6.1 and Build each time. Open P3 and Build. Open N1 and Build. | Capture the selected target and build result at each step. N1 shows the incompatibility error requiring DS4.0 and does not start a build. Agent confirms target metadata for successful runs and no N1 output. |
| V05 P3 | With license accepted, Deploy with deployment path empty; nonexistent; an existing directory missing `Ed-Fi-ODS` or `Ed-Fi-ODS-Implementation`. Restore the supplied valid path. | Appropriate setting/path/structure error for each variant, no success notification. Agent confirms deployment tree unchanged. |
| V06 P1–P4 | Open each valid workspace and run Build. Expand the Sample `MetaEdOutput` folder after completion. | Building notification followed by success; fresh output visible in Explorer; no unexpected Problems. Agent confirms target metadata and content. |
| V07 P3 | Use supplied edits: invalid token; missing documentation; reversed decimal bounds; missing identity; duplicate property. Save each, then restore. Click its Problems entry. Also type/save a valid→invalid→valid edit sequence. | Error squiggle, readable Problems message, severity and line/column, and navigation to the affected token. After repair, error/squiggle clear without reloading. Capture both error and cleared state. Note unsaved-only behavior separately; do not assume buffer contents reached the disk-based pipeline. |
| V08 P3 | Delete QaPeer while QaLink refers to it; Build; restore. Then remove Sample from the workspace and re-add it without restarting VS Code; open QaLink and Build. | Referencing file gets a visible error and failed build after deletion; restoration clears it and builds. Explorer reflects remove/add; reimported files retain MetaEd highlighting and build successfully. |
| V09 P1–P4 | Deploy each valid pair. On P1 let the agent seed a stale marker, then Deploy again. On P3 let the agent remove the target Sample project directory, then Deploy. Restore it, invalidate a source file, and Deploy once more. | Success notifications on valid runs, useful failure for missing target, and visible build failure for invalid source. Any deploy-success notification following the failed build is a failure. Agent verifies copied files, P1 marker removal, and unchanged target after failed build. |
| V10 P3 | In the disposable installation, open a **bundled** DS file with Alliance Mode off. Make a harmless edit and try Save; cancel any override. Restore. Enable Alliance Mode, reload, and repeat with a harmless edit. | With mode off, a read-only/save-protection prompt prevents silent overwrite. With mode on, setting persists and edit saves without protection. Capture path, mode, prompt/success. Agent checks contents/permissions and restores them. Run on Windows to cover the historical drive-letter case issue; another OS is not Windows proof. |
| V11 P3 | Set target/deploy path; reload the window; inspect Settings; run Build and Deploy twice, waiting for each completion. | Settings persist at the intended workspace scope; extension reactivates; each action completes once without stale Problems, duplicate notifications from extra clients, or a hung session. |

When ordinary A/V tests use copied DS models, a startup prompt about bundled models may appear.
Capture it but do not mistake that alone for a build failure. Protection in V10 specifically
requires the installed extension's bundled DS path.

## Conditional checklist

| ID | Do this | Required visual proof |
| --- | --- | --- |
| V12 Windows + Excel | Build P3; open a generated dictionary/handbook `.xlsx` in desktop Excel and keep it open. Rebuild. Close Excel and rebuild again. | Evidence the generated file is open in Excel; controlled build failure with useful error while the file is locked; successful recovery after closing it. Agent checks fresh output and logs. If that Excel configuration does not lock the file, record the lock prerequisite as unestablished, not a pass. |
| V13 isolated installed VSIX | Install the run's VSIX in a clean test profile. Open P3. Disable/reload; enable/reload; set a workspace target; uninstall/reload; reinstall the same VSIX. | Installed version and activation; commands/actions disappear when disabled/uninstalled and return when enabled/reinstalled. Existing workspace settings remain; reinstall is not a factory reset. Agent verifies VSIX hash and active extension path. |
| V14 public release | Search MetaEd in Extensions; inspect version, description, and links. In an isolated profile with the agreed older version and auto-update enabled, exercise the available update to the intended public version. | Correct listing/version; update offered or performed; updated version active after reload; release information, if provided, is accessible; V01 and a P3 build still work. If no newer public release exists, report Blocked rather than simulate a pass. |

## Return results

For each case/variant give the agent: ID and pair, Pass/Fail/Blocked, one sentence describing
actual behavior, and screenshot/recording filenames. If the required view was not captured,
repeat only that action or report missing evidence. Never use screenshots from the historical
Jira ZIP as proof of the new run. Let the agent finish file checks and cleanup before closing
the final test host.
