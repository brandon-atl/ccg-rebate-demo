# SQL walkthrough

## Tables to mention

- `fact_transaction`: transaction grain source table
- `dim_shop`: affiliate/shop conformed dimension
- `dim_vendor`: vendor entity plus parent crosswalk
- `dim_product`: SKU/category eligibility
- `dim_program`: rebate program rule table
- `fact_rebate_claim`: claim status
- `fact_bi_followup`: operator feedback loop
- `fact_shop_kpi`: small companion table for peer-cohort preview

## Gold view logic

`vw_rebate_gold` joins:

```sql
fact_transaction
JOIN dim_vendor
JOIN dim_product
JOIN dim_program
LEFT JOIN fact_rebate_claim
LEFT JOIN fact_bi_followup
```

Then it applies:

```text
qualifying vendor parent
qualifying product category
active program window
purchase only / net out returns and voids
claim status null or rejected
maturity_days >= 60
exclude resolved/false-positive follow-up labels
```

## Work queue

`vw_shop_action_list` groups by:

```text
shop, vendor parent, rebate program, reason, follow-up status
```

and sorts by estimated leakage dollars.
