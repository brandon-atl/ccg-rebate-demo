# Interview demo script

## Opener

I built a small synthetic artifact after Round 1 because I wanted to make the rebate leakage problem concrete. I did not use any CCG data. It models NetSuite-style transactions, vendor-program eligibility, claim status, the 60-day maturity rule, and a BI action list. The goal is not to show a pretty dashboard; it is to show how I think through grain, eligibility logic, data quality, and the workflow after a flag is produced.

## Walkthrough

### 1. Architecture page

Say:

> I built this as a thin production slice: one source pattern, one rule set, one action list, one feedback loop. If this were production, I would move the orchestration into ADF, land raw data in ADLS, version the silver/gold transformations, and surface the semantic model in Power BI.

### 2. Data-quality page

Say:

> I want to show the trust layer before the chart. This is where I check row counts, duplicate transaction IDs, invalid program windows, returns/voids, immature transactions, and vendor crosswalk usage. The dashboard only matters if the BI team trusts the underlying flags.

### 3. Executive summary page

Say:

> This view answers the leadership question: how much eligible rebate value appears to be leaking, where is it concentrated, and which vendors/programs are driving it?

### 4. Action list

Say:

> This is the most important page operationally. It is not just a chart; it is the BI team’s work queue. Each item has a shop, vendor, program, reason, status, leakage estimate, and next action.

### 5. Cohort preview if Georgiana is engaged

Say:

> This is only a preview, but it shows how the same shop dimension can support the next use case: peer-relative performance management. I would validate cohorts with Georgiana’s team before any affiliate sees them.

## Close

> The technical work here is not exotic. The value is making an invisible operational leak visible, trusted, and actionable. The architecture has clean seams so the first use case becomes the first reusable pattern for the lakehouse.
