# Architecture notes

## Demo flow

```text
Python synthetic source generator
  -> dim_shop / dim_vendor / dim_product / dim_program
  -> fact_transaction / fact_rebate_claim
  -> vw_rebate_gold
  -> vw_shop_action_list
  -> Next.js dashboard
  -> fact_bi_followup labels
```

## Core grain

The core grain is transaction x rebate program. That matters because one transaction can potentially map to multiple program rules, and rebate claim status has to be checked at the same grain.

## Why the vendor parent crosswalk exists

One common leakage pattern is the same parent vendor posting under multiple subsidiaries/entities. The demo handles this through:

```text
dim_vendor.parent_vendor_code
```

The gold view joins program rules on `parent_vendor_code`, not just the raw vendor entity.

## 60-day maturity rule

The gold view excludes any transaction with:

```sql
maturity_days < 60
```

Reason: flagging immature transactions would create false positives and damage trust.

## Feedback loop

`fact_bi_followup` lets analysts mark each flag as:

```text
new / in_progress / claimed / unclaimable / false_positive
```

That is the difference between a one-shot rules report and an improving operational system.

## Future-state Azure mapping

| Demo | Azure/CCG production equivalent |
|---|---|
| Python generator | NetSuite REST or SuiteAnalytics extract |
| Postgres raw tables | ADLS Gen2 bronze landing |
| SQL views | ADF/Synapse/Databricks transforms |
| Next.js dashboard | Power BI semantic model |
| Follow-up table | BI workflow / labeled feedback signal |
