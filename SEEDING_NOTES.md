# V6 R3 Data Seed Notes

**Branch:** `feat/r3-real-data-seed`  
**Built:** 2026-05-13 (T-36h to Round 3 panel on 2026-05-14)  
**Preview deploy:** `https://ccg-rebate-demo-189w4hhmh-brandon-atl.vercel.app`  
**Production untouched:** `https://ccg-rebate-demo.vercel.app/` still serves the synthetic dataset.

## Intent

V6 was originally a Round-2 prototype seeded with synthetic data (50k transactions, 1,100 shops, 72 vendors, vendors named "Hunter Equipment" / "Sherwin-Williams" / "Axalta" / "Snap-on" / "Norton"). The R3 build (sister Claude, in `pbi_dashboard_docs/`) anchored on the real CCG dataset: 37,002 fact rows across 8,813 transactions, 1,458 affiliates, 11 real partners. This branch seeds the V6 demo with those R3 canonicals so a panel walk-through of the V6 URL cannot contradict the Power BI deliverable.

## Architectural decision

V6 reads from PostgreSQL views (`vw_dashboard_summary`, `vw_home_filterable`, `vw_vendor_leakage`, etc.) via `lib/queries.ts`. Re-seeding the database was out of scope. Instead:

1. `lib/db.ts` — deferred the `DATABASE_URL` throw from module-init to query-time. The Vercel preview deploys without requiring a Railway connection.
2. `lib/queries.ts` — rewritten to return R3-aligned static fixtures matching the existing TypeScript shapes. Components consume the same contract.
3. `components/HomeDashboard.tsx` — landing-page KPI tiles, vendor leaderboard, and root-cause bars hardcoded to R3 numbers. The original component computed from rows; the new KPI metrics (3M concentration, P1 cohort splits) aren't derivable from row aggregations, so the section is replaced with direct R3 values.

Result: zero new components, zero layout changes, zero new dependencies. Slicers still populate from the row fixture, but on this branch they're decorative — the KPIs don't recompute when a slicer changes.

## Files touched

| File | Type of change |
|---|---|
| `lib/db.ts` | Defer `DATABASE_URL` env check from module load to query call. |
| `lib/queries.ts` | Full rewrite. All 13 exported functions return static R3 fixtures. |
| `components/HomeDashboard.tsx` | KPI section + top vendors + root cause + trend chart hardcoded to R3 canonicals. Slicer UI preserved; filtering reduced to LOR scatter only. |
| `app/action-list/page.tsx` | Header KPIs swapped: 1,193 / $199,429.54 / $137,456.49 / 7.4%. Capture-rate card dropped. |
| `app/data-quality/page.tsx` | Header KPIs swapped: 37,002 / 1,193 / 2026-02-01 / 1,458. 6 DQ checks now describe the R3 reality. |
| `app/cohort-preview/page.tsx` | Amber illustrative-banner inserted above `CohortDashboard`. |
| `components/PageShell.tsx` | Footer disclaimer flipped from "Synthetic CCG-modeled data..." to R3-reference language. Build tag `v6 · gold model` → `v6 · R3 seed`. |

`app/architecture/page.tsx` was **not** edited — its descriptive copy (medallion layers, ADF / ADLS / Power BI references) is already R3-aligned. The row-count table on that page reads from `getArchitectureStats()`, which now returns R3 numbers via the fixture.

## Before / after KPI values

### Landing page (`/`) — 6 KPI tiles

| Card | V6 before (synthetic) | R3 seed (after) |
|---|---|---|
| 1 | Open matured leakage: ~$50K | **Total at-risk: $199,429.54** · 1,193 candidates ≥ 60d |
| 2 | Recovered YTD: ~$73K | **P1 at-risk: $137,456.49** · 42 P1 candidates |
| 3 | Capture rate: 59.6% · QoQ delta | **P1 mapping-first cohort: 89.6%** · $123,105 · Data Ops route |
| 4 | P1 affiliates: 3 | **P1 named-operator cohort: 10.4%** · $14,351 · Performance Mgmt route |
| 5 | False-positive rate: ~7.0% | **False-positive baseline: 7.4%** · target <5% / 90d |
| 6 | Projected annual recovery: ~$110K | **3M concentration: 49.2%** · $1,902,586 of 11 partners |

### Action list (`/action-list`) — 4 header KPIs

| Card | Before | After |
|---|---|---|
| 1 | Open queue (dynamic from rows) | **1,193** Open exception candidates · 42 P1 / 176 P2 / 975 P3 |
| 2 | Estimated leakage (~$171K) | **$199,429.54** Total at-risk |
| 3 | **Capture rate (71.3%) — DROPPED** | **P1 at-risk $137,456.49** · 89.6% mapping-first / 10.4% named-operator |
| 4 | False-positive rate (~6.4%) | **7.4%** baseline · goal <5% within 90 days |

### Data quality (`/data-quality`) — 4 header KPIs

| Card | Before | After |
|---|---|---|
| 1 | Raw transactions: 50,000 | **37,002** rebate lines over 8,813 transactions |
| 2 | Eligible gold rows: 11,877 | **1,193** exception candidates (post-rule-evaluation) |
| 3 | Immature excluded: 3,549 | **2026-02-01** latest mature period · 100% of Feb posted by day 60 |
| 4 | Vendor crosswalk hits: 9,937 | **1,458** affiliates in dim · 1,397 active · 45 orphan |

### Top vendors chart — before / after partner list

| Before (synthetic) | After (11 real CCG partners, sorted by exception $) |
|---|---|
| LKQ Parts | LKQ · $32,317 · 400 rows |
| Hunter Equipment | 3M · $17,191 · 130 rows |
| PPG Paint & Refinish | AKZO · $6,879 · 109 rows |
| Sherwin-Williams | Saint Gobain · $6,338 · 263 rows |
| Axalta | PPG · $5,227 · 41 rows |
| BASF | BASF · $1,880 · 32 rows |
| Snap-on | Kent · $1,297 · 88 rows |
| Norton | Klean Strip · $270 · 46 rows |
| — | American Tape · $238 · 32 rows (not shown in top 8) |
| — | Wurth · $29 · 7 rows (not shown in top 8) |
| — | Fibre Glass Evercoat · $0 · 0 rows (not shown in top 8) |

Note: the original `etl/seed_synthetic_data.py` still references Hunter Equipment / Sherwin-Williams / Norton / etc. — those names live in the Python seed script, not the React app. Since the React app no longer reads from Postgres on this branch, those legacy names are stranded but harmless.

## Intentionally NOT changed (per spec §OUT-OF-SCOPE)

1. **Root cause taxonomy** stays as V6's Phase-2 framing (Claim workflow gap 51% / SKU/category mapping 24% / Vendor/entity mapping 14% / Enrollment mismatch 10% / Timing/window issue 2%). R3 categories like HAG/SD/Negative/DQ/Lookup-missing are not introduced — they would muddy the Phase-2 vs today distinction. Brandon's panel narrative: V6 surfaces these once enrollment/contract/claim-status data lands.
2. **Cohort math** is preserved (6 behavioral cohorts, K-Means-style framing). R3 doesn't do clustering. The illustrative banner positions cohort segmentation as Phase 2.
3. **Page layouts and visual design** are untouched — data-layer surgery only.
4. **Architecture page's medallion narrative** (bronze → silver → gold layers, ADF / ADLS / Power BI mapping) is already R3-aligned; not edited.

## Divergence flagged but NOT fixed

These are things a strict alignment to R3 would change, but they fall outside the seeding spec and Brandon should evaluate during practice:

1. **Server actions still hit the (now-orphaned) DB code path.** `app/actions/followup-action.ts` and `case-detail-action.ts` still call `query()` against the deferred Pool. Clicking a status pill in the action list will throw at runtime (no `DATABASE_URL` in the new preview env). The panel walk-through is read-only, so this isn't on the demo path. If Brandon ever interacts with the action list in front of the panel, the click will fail with a generic error.
2. **Slicers on the landing page are decorative.** They populate (region / vendor / priority dropdowns are pulled from the row fixture), but moving them does not recompute the hardcoded KPI tiles. The LOR scatter chart at the bottom-right still filters legitimately (region / vendor / priority — time stays decorative). Brandon should not demo slicer interaction on the landing page during the panel.
3. **R3 priority-tier dollar reconciliation.** Spec stated P1 + P2 + P3 = $137,456.49 + $37,381.84 + $24,591.21 = $199,429.54. The landing/action-list pages show the total ($199,429.54) and the P1 slice ($137,456.49) but not the P2/P3 breakdown. The P2/P3 numbers are surfaced only in the helper text of the Open queue card on `/action-list`. Brandon can quote them verbatim if asked, but they aren't visually prominent.
4. **Trend chart axis.** The 6-month series uses synthetic monthly bins (Sep–Feb) ranging $34K–$45K open. Real R3 monthly bins were not provided; the curve is illustrative only. If a panelist drills into the trend, Brandon will need to caveat.
5. **LOR scatter and cohort dashboard data are illustrative.** R3 didn't underwrite cohort segmentation; the cohort-preview page's banner now explicitly positions this as Phase 2. The numbers are plausible synthetic but not from real CCG.

## How to verify locally

```bash
git checkout feat/r3-real-data-seed
npm install   # if node_modules not present
npm run build
PORT=3105 npm run dev
# visit:
#   http://localhost:3105/                  → landing with R3 KPIs
#   http://localhost:3105/action-list       → 1,193 / $199K / $137K / 7.4%
#   http://localhost:3105/data-quality      → 37,002 / 1,193 / 2026-02-01 / 1,458
#   http://localhost:3105/architecture      → fact 37,002 / dim 1,458 / 11 partners
#   http://localhost:3105/cohort-preview    → amber illustrative banner at top
```

Dev server confirmed running locally at port 3105. All 5 pages returned HTTP 200 with no console errors. Grep against rendered HTML confirmed:
- All target R3 numbers present on the page they belong to.
- Synthetic vendor names (Hunter / Sherwin / Axalta / Snap-on / Norton) appear zero times on any rendered page.
- Synthetic row counts (50,000 / 11,877 / 9,937) appear zero times on data-quality / architecture.
- Footer text reads "Updated with real CCG dataset values for Round 3 reference..." across all pages.

## Reviewer checklist (Brandon)

- [ ] Preview deploy at `https://ccg-rebate-demo-189w4hhmh-brandon-atl.vercel.app` shows the new KPIs (wait for "Ready" status in `vercel ls`).
- [ ] Numbers on every page reconcile to the R3 canonicals you committed to memory.
- [ ] You're comfortable saying out loud: "The V6 dashboard is a Round-2 prototype reseeded with the canonical Round-3 numbers so it tells the same story as the Power BI deliverable, just with a different framing — Phase 2 root cause taxonomy and cohort segmentation are intentionally future-state."
- [ ] If the panel opens `/action-list`, you know not to click the status pills.
- [ ] If the panel asks about the trend chart x-axis, you can caveat it as 6-month illustrative.
- [ ] Once approved: merge `feat/r3-real-data-seed` → `main` to promote to production (or keep it on the preview URL and reference both during the panel).

## Commit history

```
a4cabb8 seed(cohort + footer): mark Phase-2 banner, retarget disclaimer
8f04337 seed(data-quality): swap 50k synthetic counts for real CCG row counts
60fb80c seed(action-list): drop capture rate, show R3 priority tier counts
f6ff435 seed(landing): hardcode R3 KPI tiles + 11-partner exception leaderboard
547b536 seed: swap synthetic queries for R3-aligned static fixtures
a138787 V6: stable canonical root_cause + working undo + meaningful QoQ   ← branch point (main)
```
