# Atlas Fresh — Daily Export Planner

A browser workspace for the daily **Production × Commercial committee** of Atlas Fresh, a fictional apple exporter. It follows the journey **Load → Compare → Plan → Decide → Explain** for one daily snapshot:

- It loads and validates the supplied workbook on the server.
- It compares plan with actual receipts by farm and quality segment.
- It computes a deterministic farm → client allocation within the 500 t station limit.
- It makes client risk, export value and the low-value local-market residual obvious.
- It explains the result through a small, grounded, read-only assistant.

> **Decision support only.** The app prepares the committee. It never executes, confirms or sends anything. Production and Commercial approve the plan.

The original assessment instructions are in [ASSESSMENT_BRIEF.md](ASSESSMENT_BRIEF.md) and the PDF. All data is synthetic.

## The business problem in one paragraph

Twenty farms planned to deliver **600 t** today but delivered **560 t**. The mix also differs from plan: A is 11.7 t short, B and C are short, and D is over plan. Ten clients bought specific qualities (EXACT or MINIMUM rule) at different prices. The station can condition only **500 t** for export. Whatever is not exported is sold locally at **10 %** of its segment reference price. The workbook has no farm-to-client mapping, so the app builds that mapping deterministically and shows *why* each client is complete, partial or unserved.

## Quick start (clean clone)

Prerequisites: **Node.js ≥ 22.12** (tested on Node 24) and npm. No database, no API key, no paid service.

```bash
npm ci            # install exact locked dependencies
npm run dev       # http://localhost:3000  (development)
```

A [Makefile](Makefile) wraps the same commands. Run `make` to list them: `make install`, `make dev`, `make test`, `make check` (typecheck, test and build), `make env` (creates `.env` from `.env.example`). Make is optional; every target is a plain npm script.

On start the page loads the workbook, validates it, plans, and shows the result. **Reload workbook & re-plan** repeats all three steps, so after editing the `.xlsx` you only need to save it and click reload.

| Task | Command |
|---|---|
| Tests (Vitest, 46 tests) | `npm test` |
| Type check | `npm run typecheck` |
| Production build | `npm run build` |
| Run production build | `npm start` (port 3000) |

To use a different workbook, set the optional `WORKBOOK_PATH=/path/to/file.xlsx`. It defaults to `./Atlas_Fresh_Production_Commercial_Data.xlsx`, which is never modified.

## Architecture

One Next.js (App Router) + TypeScript application. Business logic lives in plain TypeScript modules with no UI or framework dependencies. Route handlers are thin, and the React UI renders server-computed values only.

```
Atlas_Fresh_….xlsx (read-only)
   │  src/lib/workbook/readWorkbook.ts   locate tables by header row, copy raw cell values (SheetJS)
   ▼
RawWorkbook ──► src/lib/validation/validate.ts   reject invalid input, every issue located
   ▼
Dataset (typed source data)
   │  src/lib/planning/engine.ts         deterministic reference policy (pure function)
   │  src/lib/planning/invariants.ts     hard-limit checks recomputed on every plan
   │  src/lib/planning/insights.ts       gap → client-shortage links, exceptions
   ▼
PlanResult (computed; separate type) ──► src/lib/server/store.ts (in-memory snapshot)
   ▼
API  POST /api/load · POST /api/plan · GET /api/result · GET|POST /api/assistant
   ▼
React UI  src/features/*     Overview · Production · Commercial · Allocations · Assistant
                              ▲
src/lib/assistant/*  explains PlanResult only (topics → minimal facts → model → grounding check)
```

| Endpoint | Purpose | Responses |
|---|---|---|
| `POST /api/load` | Read and validate the workbook; clears any previous plan | 200 `valid` summary · 422 list of issues |
| `POST /api/plan` | Run the engine on the loaded dataset | 200 `PlanResult` · 409 if nothing valid is loaded |
| `GET /api/result` | Latest computed plan | 200 · 404 if none |
| `GET /api/assistant` | Is an AI provider configured? (never returns keys) | 200 |
| `POST /api/assistant` | `{question}` → grounded explanation | 200 · 400 bad input · 409 no plan |

Unexpected failures return typed JSON `500 {error, message}`. The UI never shows stale figures after a failed reload.

## User interface

The UI renders server-computed values only. It is organised by feature, and styles live in CSS Modules next to the component that uses them.

```
src/
  app/                  Next.js pages and API routes (thin)
  styles/               tokens.css (colours, type, spacing, dark theme), base.css, print.css
  components/ui/        shared building blocks: Button, Pill, Card, Segmented, Icon, tables, …
  components/           shared pieces that know the data (ResidualTable)
  hooks/                useHotkeys, useTheme, useCountUp
  features/
    planner/            the shell: top bar, five-step navigation, loading / error states, quick-jump palette
    overview/           verdict, Crop Flow diagram, decisions, plan-vs-actual bars, local residual
    production/         farm × segment heat table
    commercial/         client rows with reasons and sources
    allocations/        traceable ledger, filters, plan policy and checks
    assistant/          grounded planning assistant
    trace/              click-to-trace and hover-to-highlight, shared by every view
  lib/                  business logic (engine, validation, workbook, assistant). No UI code.
```

Design decisions, and why:

- **One story per screen.** Overview opens with a one-sentence verdict, then shows the Crop Flow diagram: segments → clients → local market, with ribbons of real allocated tonnes. A manager can see what arrived, what was exported, who is short and what fell to the local market without reading a table.
- **Production and Commercial are connected, not separate tables.** Each client at risk has a cause chain (farms below plan → segment gap → client short, or station limit → fruit left over → client short). On the Production table, cells whose gap left a client short carry a red frame and the client ID.
- **Hover or focus any ID to follow it.** Client, farm and segment IDs light up their ribbons in the diagram. Click any ID to open its allocations.
- **Colour never carries meaning alone.** Variances have arrows and signs, statuses have icons and words, and the shortage in the diagram is dashed. Every colour pair passes WCAG AA contrast in both themes (text 4.5:1, marks 3:1).
- **Honest about money.** Amber always means value lost to the local market, and red always means a client at risk.
- **Light and dark themes**, chosen from the system setting on first visit and remembered afterwards. Motion respects `prefers-reduced-motion`.
- **Fonts are self-hosted** through `@fontsource-variable` packages, so a clean clone builds with no network access to a font service.

Keyboard: `1`–`5` open the views, `/` focuses the main filter or question box, `Ctrl/Cmd + K` opens quick jump (any client, farm, segment or view), arrow keys move between the tabs. The Overview prints as a one-page committee brief.

## Deterministic planning policy (implemented exactly as briefed)

1. **Supply** is each farm's **actual** A/B/C/D tonnes. Expected tonnes (`capacity × mix`) are used only for comparison.
2. **Client order:** export price per tonne, highest first; ties go by `client_id` ascending, using plain code-unit order rather than locale order.
3. **Compatibility:** `EXACT X` accepts X only. `MINIMUM X` accepts X or better, with quality ordered A > B > C > D.
4. **Supply order per client:** smallest quality upgrade first (e.g. MINIMUM C uses C, then B, then A), then `farm_id`.
5. **Allocation** moves in 5 t steps until the client's demand, the compatible supply or the station capacity is exhausted.
6. **Status:**
   - COMPLETE when allocated = demand.
   - PARTIAL when 0 < allocated < demand.
   - UNSERVED when allocated = 0.
   - At risk means PARTIAL or UNSERVED.
   - The shortage reason is `STATION_CAPACITY_REACHED` if the station is full when the client finishes processing. Otherwise it is `INSUFFICIENT_COMPATIBLE_SEGMENT`.
7. **Local residual:** every unexported actual tonne, valued at `tonnes × local_market_ratio × reference price of its segment`. Reference prices are used **only** here.
8. **Invariants** are checked on every plan and in tests:
   - export ≤ capacity
   - client export ≤ demand
   - farm-segment export ≤ actual
   - every allocation is compatible
   - export + local = actual
   - no negative balances
   - all quantities move in 5 t steps

KPIs follow the brief:
- export rate = export ÷ actual
- export revenue = Σ allocated t × client price
- total value = export revenue + local value

**Baseline result:** computed from the workbook by the engine, not hard-coded. The test suite asserts all of it.

| Metric | Value | Metric | Value |
|---|---|---|---|
| Expected plan | 600 t | Actual received | 560 t (A 90 / B 160 / C 180 / D 130) |
| Station capacity | 500 t | Export | 500 t |
| Export rate | 89.3 % | Local volume | 60 t (D: F15 5, F16 20, F19 5, F20 30) |
| Export revenue | EUR 549,500 | Local value | EUR 4,500 |
| Total value | EUR 554,000 | At risk | 3: C02 & C09 `INSUFFICIENT_COMPATIBLE_SEGMENT`, C08 `STATION_CAPACITY_REACHED` |

## Validation rules (server-side, nothing is silently repaired)

Each issue reports **sheet, Excel row, entity ID, field, problem and a concrete fix**. All issues are collected and shown together. If any issue exists, no plan is produced.

- **Structure:** the file exists and opens. The `Farms`, `Clients` and `Station` sheets exist. Every required header column is present.
- **IDs:** a `farm_id` or `client_id` must not be missing or duplicated. It must be letters, digits, `-` or `_` only. A farm and a client may not share an ID.
- **Values:** `acceptance_mode` ∈ {EXACT, MINIMUM}, and `requested_segment` and reference segments ∈ {A, B, C, D}. These are case-sensitive and never coerced.
- **Mix:** each `expected_X_pct` is a number in 0–1, and the four fractions sum to 1.0 (±1e-6) per farm.
- **Quantities:** `actual_X_t` and `demand_t` are non-negative multiples of 5 t. Text, booleans and negatives are rejected. `expected_daily_capacity_t` is ≥ 0 with at most one decimal.
- **Station:** exactly one station row. Capacity is a positive multiple of 5 t. `local_market_ratio` is in 0–1. There is exactly one positive reference price for each of A/B/C/D, and a missing segment price is an error.
- **Prices:** `export_price_per_t_eur` must be greater than 0.

## Grounded assistant

The assistant answers the three required questions, available as one-click presets, plus free-text variations of them:

1. *Which clients are at risk and why?*
2. *Which farm/segment gaps matter most today?*
3. *Why are 60 t going local and what is their estimated value?* The tonnage in this question comes from the current plan.

How an answer is produced:

- **The engine is the authority.** The model never sees the workbook and never allocates, calculates or approves. The server classifies the question and sends only the **minimal fact list** for that topic, with numbers already formatted by the server.
- **Output validation:**
  - The model must return JSON `{answer, evidence_ids}`.
  - Answers are **rejected** if they cite or mention unknown IDs (e.g. `C99`) or contain any number not present in the supplied facts.
  - Answers that cite no farm, client or segment are also rejected, unless they say the information is unavailable.
  - Evidence IDs are rendered as clickable links into the allocation trace.
- **Honest fallbacks:**
  - **No provider configured** (the default): a clearly labelled *Deterministic summary — no AI*, generated from the plan.
  - **Timeout, provider error or rejected output:** the UI says so explicitly and shows the deterministic summary. It never fakes an AI answer.
  - **Off-topic questions** (e.g. freight, weather) are answered as *unavailable*, and **action requests** (approve, send, reallocate) are refused as read-only. Neither calls the model.

Optional configuration is through environment variables only; see [.env.example](.env.example).

```bash
# DeepSeek (hosted). Put DEEPSEEK_API_KEY=… in .env (git-ignored); that alone enables it. Default model: deepseek-flash
npm run dev
# Free local model via Ollama (OpenAI-compatible endpoint)
LLM_PROVIDER=openai-compatible LLM_MODEL=llama3.1:8b LLM_BASE_URL=http://localhost:11434/v1 npm run dev
```

The DeepSeek path does three things:
- asks for JSON output, which keeps the `{answer, evidence_ids}` reply parseable
- turns off DeepSeek's reasoning phase and caps output tokens, which suits short explanations and keeps answers fast
- sends the key only in the `Authorization` header from the server. The browser never sees it.

## Tests (`npm test`)

| File | Covers |
|---|---|
| `tests/planning.test.ts` | Public baseline; outputs change when an input changes; price ordering and `client_id` tie-break; reference prices excluded from ordering and revenue; EXACT vs MINIMUM; smallest-upgrade then `farm_id`; station cap and reason; demand and farm-segment limits; residual; determinism under shuffled input |
| `tests/validation.test.ts` | Duplicate or missing IDs; bad mode or segment; mix outside 0–1 and sum ≠ 1; negative, text and non-5 t quantities; capacity 0 or 503; missing reference price |
| `tests/workbook.test.ts` | The real file loads and stays byte-identical (SHA-256); an edited `.xlsx` copy is rejected with sheet, row, ID and field; missing file |
| `tests/flowLayout.test.ts` | Crop Flow maths: every exported and residual tonne has a ribbon, nodes stay on the canvas and scale with tonnes, no local node when nothing goes local, highlight matching by client, segment or farm |
| `tests/paletteItems.test.ts` | Quick-jump entries (5 views, 10 clients, 20 farms, 4 segments), case-insensitive filtering, view vs trace actions |
| `tests/provider.test.ts` | DeepSeek configuration and defaults, missing key or model reported, JSON-mode request body, no DeepSeek-only fields for other providers, HTTP error and empty-reply handling |
| `tests/assistant.test.ts` | Grounded answer accepted, with only minimal facts sent; unknown ID, invented number and non-JSON output rejected; deterministic summaries pass the same grounding check; unsupported and action questions never call a model; no-key, provider-failure and timeout states are honest |

## Assumptions

- **Zero station capacity is invalid.** The brief requires "non-negative multiples of 5" but also rejects "invalid capacity". A station that can export nothing is treated as invalid.
- **When supply and capacity run out at the same moment**, the reason is `STATION_CAPACITY_REACHED`, following the brief's "if capacity is exhausted, use …".
- **IDs are case-sensitive** and sorted by code-unit order, so `F02` < `F10`. The supplied IDs are zero-padded.
- **Farm and client names are informational only** and are not validated.
- **"Gaps that matter most"** are below-plan segments that contributed to an `INSUFFICIENT_COMPATIBLE_SEGMENT` shortage, ranked by client shortfall tonnes. Within a segment, farms are ranked by largest shortfall. The other below-plan segments are listed as having no client impact today. This is an explanation layer only; it never changes the allocation.
- **The local-market reference value** ("worth EUR 45,000 at export reference prices") is shown as context for the 10 % discount. It is not a KPI from the brief.

## Limitations and intentional omissions

- **State is in memory** in a single server process, which is enough for one committee session. A restart requires a reload, which the UI does automatically. There is no database by design.
- **The workbook is read from disk.** There is no upload UI, as the brief allows.
- **Out of scope per the brief:** authentication, roles, audit trail, persistence, forecasting, multi-day, multi-station or multi-product optimisation, manual allocation editing, scenario simulation, logistics and integrations. None of these are built.
- **The assistant only supports the three explanation topics.** A free-form chat over arbitrary questions was intentionally not built, to keep the grounding boundary strict.
- **Desktop only.** The layout targets 1024–1440 px; mobile is not a target.

## Verification performed

- **Automated:**
  - `npm test`: 46/46 passing.
  - `npm run typecheck` and `npm run build` succeed with no warnings.
- **API (production build, curl):**
  - Before loading, `GET /api/result` returns 404 and `POST /api/plan` returns 409.
  - Load returns 200 (20 farms, 10 clients).
  - The plan reproduces every baseline value above, with 7/7 invariants passing.
  - The assistant reports `no_provider` with a deterministic answer citing C02/C09/C08.
  - An off-topic question returns `unsupported`; a malformed body returns 400.
- **Invalid workbook:** a temp copy with F07 mix = 1.4 and C01 demand = 52 returns 422 with both issues located, the plan is refused with 409, and the UI shows the validation table with no figures.
- **Source file unchanged:** the workbook SHA-256 stays `46620fea…bb923cb` before and after all runs.
- **Visual:** headless Chromium screenshots of every view at 1024 px and 1440 px, in light and dark themes. No page-level horizontal scroll at either width.
- **Interaction (scripted browser):** hover and focus highlighting in the Crop Flow, `Ctrl+K` palette to Allocations, `1`–`5` and `/` shortcuts, arrow-key tabs, theme persistence after reload, and the loading, rejected-workbook and server-error screens (API responses faked in the browser).
- **Accessibility checks:** colour contrast of every token pair in both themes (script), reduced-motion emulation, and the print layout of the Overview.
- **Real model call:** `LLM_PROVIDER` unset with only `DEEPSEEK_API_KEY` present uses DeepSeek (`deepseek-flash`). The question *Which clients are at risk and why?* returned a grounded answer that passed validation, citing C02, C09 and C08.
- **Not verified:** a screen reader pass (keyboard use and ARIA roles are implemented and scripted, but not tested with NVDA or VoiceOver), and browsers other than Chromium. The UI uses `color-mix()` and the native `<dialog>` element, which need a current browser.

## AI coding tools disclosure

- **Tool:** Claude Code (Claude Opus 5.5).
- **What it did:** read the brief and workbook, and wrote the code, tests and this README.
- **How it was checked:** the baseline policy was traced by hand before coding (C02 40/50, C09 30/50, C08 20/50, 60 t of D local), and everything else was checked through the commands and checks listed above.
- **Approximate time:** _fill in your own review and walkthrough time_; the implementation itself was produced in one assisted session.

## Next three production steps

1. **Committee sign-off record.** Persist each approved daily plan (input hash, plan, approver, timestamp), so the decision is auditable and comparable day to day.
2. **Governed data intake.** Replace the file on disk with an upload or a feed from farm receipt and order systems, behind the same validation contract, with versioned snapshots.
3. **Release safety.** Add Playwright end-to-end and accessibility tests, CI running test, typecheck and build, and a hosted deployment. Monitor assistant rejection and fallback rates.
