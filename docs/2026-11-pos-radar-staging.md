# Pos Radar — Personal repository staging changes (4 November 2026)

This branch changes **only** the requested operational-report controls and backend. It does not modify SOPMIPOS/Pos-Radar or production Supabase.

## Included in this branch
- Multiple selected states in the **Laporan operasi** filter and report CSV download dialog; all relevant report filter controls retain the dark-theme styling.
- Add/edit separate BIT for each location; original `bit` column retains the first location's BIT for compatibility with existing summary and branch displays. Existing reports default every location to their old single BIT.
- Admin-only **Arkib laporan** dialog. Download a ZIP containing report CSV, JSON and images for both active and resolved reports; cleanup is restricted to resolved-report images and requires a typed phrase and an explicit saved-backup acknowledgement.
- Admin-only approximate report-photo storage byte total, count, and 90-day reminder. Reminder is per browser/device (localStorage), not a centrally scheduled job.

## Deployment requirements
1. In the **target** Supabase project's SQL Editor, run `setup/04-Location-BIT.sql` **before** deploying the updated page. This is a manual schema migration and was **not** applied by GitHub.
2. Configure `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) in the target Netlify project's server-side environment; never put it into the website or repository. Netlify function `report-archive.mjs` requires it.
3. Confirm Netlify publishes `public/` and includes `netlify/functions/`.
4. Run `npm test` in a local clone, test adding/editing a report with two locations and different BITs, exporting filtered CSV, ZIP images and archive storage indicators against a test Supabase project.
5. Test archive ZIP extraction and compare every listed image to the manifest; **do not use the delete action until a safe backup is verified.**
6. Merge only after testing and confirming Netlify deployment settings, which may publish automatically on changes to `main`.

## Limitations to address before production rollout
- Multiple-state selection is implemented for the operational-report page and its export dialog. The other embedded summary/branch pages still have their original selection logic.
- ZIP generation currently limits archives to 250 photos / 80 MiB total raw photo bytes; more must use a paginated archiving design rather than silently omitting photos.
- Storage calculation shows the size of objects in `report-photos` only and is not the official Supabase project quota. The reminder is per device, not a server-side notification.
- The archive cleanup records failures; verify Netlify storage and database consistency if cleanup fails. No backup can be verified as saved locally by the browser.
- Personal GitHub repository visibility was reported as **public** by the GitHub API on 4 November 2026. Do not commit secrets or sensitive production data. Check repository Settings if you want to make it private.

## Repositories
- Personal stage: `hudahaz/Weather-App`
- Unchanged production/company: `SOPMIPOS/Pos-Radar`
