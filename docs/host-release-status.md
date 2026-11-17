# TakeAgent host release status

Wrapbook is an optional, independently installed skill at https://takeagent.ai/skills.

CSV file preview remains available through the website and skills.preview. The latest host release preserves this workflow; it does not claim a newly released Wrapbook Excel UI.

Shared website/agent file handling belongs to [jongos/takeagent](https://github.com/jongos/takeagent), not a duplicate implementation in this adapter repository. The release is [PR #77](https://github.com/jongos/takeagent/pull/77), merged as `d6bc6e4e80ee3b9c9b412783d4e58ecfd644da8f`, following the four-skill release in [PR #76](https://github.com/jongos/takeagent/pull/76). The source and instructions are in `src/lib/skill-files.ts`, `src/lib/tabular-skill-preview.ts`, `src/lib/agent-skill-tools.ts` and `docs/optional-skills.md` in the host repository.

No vendor API credentials, new environment variables or database migration are required for this host release. Existing agent authorization, plan and usage rules apply. Skills remain off until explicitly added and removable independently. Selected-file previews do not automatically synchronize vendor accounts, establish financing, persist uploaded reports or alter saved finance plans. Native export certification and direct API access remain subject to the repository's documented vendor blockers.

Validation recorded on 2026-11-17: this repository's complete suite passed 74/74 tests. Host validation passed 394 tests, TypeScript, optimized production build, privacy scan and GitHub CI. Production browser checks reconciled CSV and XLSX for Saturation, GreenSlate and EP, then restored the original zero installations. Authenticated host MCP transport tests cover the file workflows and revocation; this is not a claim that every external agent client or vendor API was exercised. No emails were sent.
