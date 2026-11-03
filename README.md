# Pos Radar

A Pos Malaysia dashboard for weather monitoring and branch delivery-disruption reporting.

**Documentation updated: 3 November 2026.** Includes the 30-day calendar, historical dashboard and compact PPL/PSM candidate list.

| Repository | Role |
| --- | --- |
| [SOPMIPOS/Pos-Radar](https://github.com/SOPMIPOS/Pos-Radar) | SO PMI production repository |
| [hudahaz/Weather-App](https://github.com/hudahaz/Weather-App) | Personal development repository; changes are merged into SO PMI |

Production hosting belongs to SO PMI. Use the production URL shown in its Netlify project; a repository update alone does not confirm a successful deployment.

Repository documentation is written in English. Website labels and operational wording remain in Malay.

## Admin: update historical data

**No coding needed.** Open the [step-by-step admin guide and ChatGPT prompt](ADMIN-HISTORICAL-DATA.md) to prepare historical-data updates.

- [Download the initial historical Excel file](https://github.com/hudahaz/Weather-App/raw/refs/heads/main/admin-data/Malaysia-Historical-Disaster-Starter.xlsx)
- [Open the reusable ChatGPT prompt](admin-data/ChatGPT-Update-Prompt.txt)

The starter has partial historical coverage. The bundled seed is used until a shared imported dataset is available. New records are previewed and validated before an active Admin confirms an append-only import. Duplicate records are skipped. Uncertain or conflicting records remain identifiable through review flags and source information; they should not be treated as independently verified incidents. Dataset totals change with imports, so use the current admin preview and dashboard counts.

## What the application does

- Shows daily and hourly weather forecasts, including temperature and precipitation for the source's stated time intervals.
- Displays MET weather warnings, APIMS air-quality readings and JPS flood/water-level warnings with distinct category colours.
- Highlights potentially affected branches and their postcode coverage.
- Collects operational reports with branch, postcode, multiple locations, BIT route code, pending-item counts, remarks and optional photos.
- Records the last editor's username and update time.
- Shows active operational disruptions in summary and branch views; resolved reports remain in operations history.
- Supports report search, inclusive report-date ranges (blank dates mean all dates), CSV export, active/resolved totals and confirmed permanent deletion.
- Provides a download dialog with independent search, state, PPL, date and active/inactive/both status filters, initially copied from the page filters. CSV files include report age and time since the last update.
- Shows report age in Malaysia calendar days in the table and one red overdue card alongside the top KPIs. Active reports with more than 72 elapsed hours since the last update are flagged red; resolved reports are excluded. Clicking the overdue card toggles an overdue-only active-report filter, respects date/state/search filters and carries that selection into the download dialog. Reset or selecting another status clears the overdue filter. Ageing refreshes every minute while the reports page is open.
- Provides a PPL selector on Ringkasan, narrowed by state, for branch summary counts, affected branch cards, map markers and the WhatsApp report. MET/IPU/JPS source tables remain overall reference tables.
- Adds a concise active-operations summary to the WhatsApp/email report text: PPL/report counts, pending-item totals, category totals and one line per PPL, following the selected state/PPL scope. Resolved reports are excluded.
- Uses Mel Plus as the display/export label for the existing mel data field; stored counts are preserved.
- Provides Admin, Manager and User accounts.

Weather warnings and branch matching support operational review; they are not proof that every postcode or parcel in a flagged branch is affected.

## 30-day calendar and historical dashboard

The complete rolling 30-day calendar remains visible. Selecting a date shows the corresponding forecast or historical detail below it.

- **Days 1–7:** available forecasts for the location selected in Ramalan 7 hari. Outlook cards show Malay weather conditions such as Hujan, Hujan renyai or Cerah berawan instead of temperature ranges.
- **Days 8–30:** sourced historical records for the same calendar dates in the previous year. Observation snapshots match their observation date; event date ranges use inclusive matching. A missing record means coverage is unavailable, not that no disaster occurred.
- **Semua negeri:** includes all states in the historical summary. It does not turn the first seven days into a nationwide forecast; those still follow the selected forecast location.

For a historical date, the page displays:

1. **Ringkasan sejarah mengikut tarikh:** counts of source records, flood records, states/WP with records and disaster types.
2. **Negeri & jenis bencana:** a state-by-state table of counts for each available disaster type, following the selected date, state and disaster filters.
3. **PPL / PSM berpotensi terlibat:** a compact list beside the table for the clicked state. Each branch appears once. This replaces the composition chart and the separate large district-by-district branch section.
4. **Source references:** the original record details, observation dates, notes and source links follow directly after the dashboard.

Clicking a state in the table changes the PPL/PSM panel. It does not change the top-level filters or narrow the reference list by itself. The historical dashboard is not shown for forecast dates.

### How potential PPL/PSM matches work

- **PPL:** normalized district names are matched to the branch district coverage within the same state.
- **PSM candidates:** PSM postcodes are checked against the matched PPL postcode ranges within the same state.
- The panel shows records without a district match and flags uncertain source records where applicable.
- Postcode coverage can extend into neighbouring districts. These are candidates for preparedness checks, not confirmed current disruptions or precise flood-boundary matches. Confirm current impact through Laporan operasi.
- Counts represent source records, not distinct flood incidents, affected people or confirmed affected branches. Repeated snapshots may describe the same event.

## Pages

| Website page | Purpose |
| --- | --- |
| Laporan kaji cuaca | Daily/hourly forecasts, location/postcode search, monitoring maps and the 30-day outlook with historical dashboard |
| Ringkasan | Summary of affected branches and active operational disruptions |
| Pecahan negeri & cawangan | State and branch breakdown, reasons and postcode coverage by SLA |
| Laporan operasi | Create and maintain delivery-disruption reports; view active and resolved records |
| Urus pengguna | Admin-only account and access management |

## Accounts and access

| Role | Reporting access | Account administration |
| --- | --- | --- |
| Admin | All branches | Yes |
| Manager | Assigned whole states and/or individual branches, combined | No |
| User (stored as staff) | One assigned branch | No |

Report reading is public at the application/database level. Adding, editing and deleting reports require an active authorised account. Netlify project visibility can additionally restrict access to the entire website.

New passwords entered through account management must contain 8–128 characters. Supabase's own password policy also applies. Existing passwords are unchanged.

**Password recovery is not complete:** the application does not yet include a recovery/change-password screen or recovery-link handling. Supabase's Site URL and allowed redirects should use the current production URL rather than localhost, but correcting the URL alone does not complete recovery.

Deletion is permanent and requires confirmation. Use the resolved status (Selesai) when the record should remain in history.

## Repository files

| Path | Purpose |
| --- | --- |
| public/index.html | Current deployed application, including its bundled UI and embedded summary/branch views |
| public/assets/pos-malaysia.svg | Supplied Pos Malaysia logo |
| netlify/functions/ | Server endpoints for shared warnings, forecasts, login, account administration and report deletion |
| netlify/functions/lib/ | Forecast conversion/cache support, JPS parsing, historical imports and the PSM catalogue |
| setup/02-Admin-Protection.sql | Database protection for active Admin accounts |
| setup/03-Manager-Access.sql | Manager state/branch access migration |
| netlify.toml | Netlify publish directory, functions directory and response headers |
| package.json | Server dependency declaration |
| NETLIFY-SETUP.md | Deployment, environment variables, database prerequisites and verification |
| Root index.html, cawangan.html, core.js, style.css, pos-data.js and proxy.mjs | Original weather application/reference files retained from the earlier version |

**Netlify publishes public, not the repository root.** Editing only the old root HTML or JavaScript files does not update the deployed bundled application. The current public/index.html is a prebuilt artifact; its separate authoring/build sources are not currently committed in this repository. Historical features have editable modules and committed tests, listed below. Add the bundled application's authoring sources before establishing a repeatable full-application build workflow.

## Branches, commits and pull requests

- **SOPMIPOS/Pos-Radar main** is the SO PMI production branch. Updates trigger the linked Netlify deployment, subject to the project's deployment settings and available credits.
- Changes saved only to **hudahaz/Weather-App main** still need to be merged into SO PMI. Open a [cross-repository pull request](https://github.com/SOPMIPOS/Pos-Radar/compare/main...hudahaz:Weather-App:main?expand=1), review the changes, merge, then check the SO PMI Netlify deployment result. Personal repository commits do not automatically synchronize the team repository.
- **codex/supabase-reporting-ui** was the development branch used for the reporting and forecast upgrade. Its changes were merged into main through [pull request #1](https://github.com/hudahaz/Weather-App/pull/1). It remains as the old development branch; it is not a second live application.
- A **commit** is a saved set of changes with a description and history.
- A **pull request** groups proposed changes for review and testing before merging them into main.
- A **Deploy Preview** is a Netlify test URL for proposed changes. Production is the main website address.

For future features, create a new branch from the latest main, test its Deploy Preview, then merge the approved pull request. Updating documentation does not require changing the website UI.

## Hosting and database

Netlify hosts the application and server functions. Supabase stores operational reports, account profiles, access assignments and photos; Supabase Auth manages login sessions.

The publish directory is public. No build command is currently required. Follow [NETLIFY-SETUP.md](NETLIFY-SETUP.md) for environment variables and database prerequisites.

The supplied project URL and publishable key are intended for browser use. Keep the Supabase secret/service-role key exclusively in server environment variables; never commit it.

The website address is managed in Netlify and may change when the project is renamed. A custom domain is optional.

## Data sources and limitations

- **Forecasts:** MET Norway Locationforecast, credited under CC BY 4.0. Forecasts preserve the provider's actual one-hour/six-hour intervals; rainfall is shown in mm for the specified period. Daily cards summarise available forecast points.
- **MET warnings:** official warning data obtained through the shared data endpoint.
- **IPU:** APIMS station readings, with accumulated shared history.
- **JPS:** current Public Infobanjir homepage notifications; historical readings are accumulated in the browser.
- **Time:** displayed operational and forecast times use Malaysia time.
- **Branch/postcode master:** the inherited snapshot contains 96 branches and 357 postcode ranges. The PSM catalogue adds 333 offices with 937 postcode entries; these entries do not supply SLA values or coordinates. Coverage, state assignments and SLA values need confirmation against the current operational master.

Sekarang, Hari ini and 7 hari can show the same affected branches when current warnings overlap or older records have not been collected. These controls do not provide a complete historical archive.

Maps show forecast locations, branches and monitoring stations, not flood boundaries or radar. A branch can cover several areas; an alert matched to one area may flag the whole branch.

**The 30-day outlook is a historical awareness tool.** Days 1–7 use available live forecasts for the selected location; days 8–30 show sourced records on the same calendar dates in the previous year. It is not a flood prediction. Historical coverage is partial, and uncertain/conflicting records carry review flags. A missing record is a coverage gap. Admin imports persist in the site-wide `pantau-cawangan-history` Netlify Blobs store and survive redeployments. Existing Supabase authentication checks active Admin access before each upload and confirmation. No new SQL migration or environment key is required.

Shared warning refresh is limited to once per 30 minutes. Open summary/branch pages poll the shared snapshot every two minutes. Provider failures may leave explicitly stale cached data or an error; check source timestamps.

## Verification and next steps

Run `npm ci` and `npm test` for the committed automated checks. These cover the historical calendar, workbook validation, import access, duplicates/conflicts, persistence and related catalogue behaviour. They do not replace browser checks of the bundled application or production permissions.

For dashboard changes, check a forecast date, a historical date with records and an empty date; change state/disaster filters; click states in the table; confirm unique PPL/PSM lists and source references; and check the narrow-screen layout.

Before wider rollout:
1. Confirm branch/postcode/SLA master data.
2. Remove or resolve clearly labelled test reports.
3. Test production login, permissions, report creation/editing, photos, resolution and deletion with test data.
4. Configure SO PMI Netlify visitor access for the intended audience.
5. Gather feedback from a small group of staff.

Outstanding work includes completing email password recovery and improving historical coverage and validating district/postcode candidate matches against the current operational master.


## Historical data implementation and tests

- `public/history-core.mjs`: rolling Malaysia calendar and previous-year event/observation matching.
- `public/history-ui.mjs` and `public/history.css`: outlook and admin import interface.
- `public/history-dashboard.mjs`: historical KPIs, state/disaster table and compact unique PPL/PSM lists.
- `public/history-branches.mjs`: branch district/postcode and PSM snapshot used by the dashboard. Keep it synchronized with the approved branch master and `netlify/functions/lib/psm-catalog.mjs` when coverage changes.
- `netlify/functions/historical-data.mjs`: public read and authenticated Admin preview/confirm endpoint.
- `netlify/functions/lib/history-*`: bounded XLSX parser, validation, initial records and import persistence.
- `public/admin-historical-data.html` and `public/admin-data/`: easily accessible guide, prompt and starter workbook.
- `tests/history.test.mjs`: run `npm ci` then `npm test` for calendar, workbook, permissions, duplicate/conflict, persistence and concurrency tests.
- `npm run seed:history`: regenerate the bundled seed from the committed starter workbook. Changes to the seed do not overwrite a dataset already imported into the shared store.
- `npm run preview:qa`: optional local QA server, with a test-only admin at `/?qa=admin`. It stores imports in memory and is never deployed as a function or public asset. No real credentials or operational reports are used.

Limits: 2 MB per workbook, 10,000 rows per import, 50,000 published records and 10,000 held records. Formula cells, macros, external links, ambiguous dates and malformed files are rejected. Uploaded original XLSX files are not retained; the canonical records, admin identity and previous published snapshot are retained. Review drafts expire after one hour for confirmation; abandoned draft blobs may require periodic maintainer cleanup. Published dataset replacement/deletion is deliberately not offered in the importer.
