# ADF bridge talking points

Use this if Anthony asks why the demo is Python/Postgres/Next instead of native Azure.

## Honest bridge

My deepest recent production orchestration has been AWS, not ADF. I built this demo in Python/Postgres/Next because it is fast to inspect, easy to deploy, and proves the data logic. The production shape maps cleanly to ADF.

| ADF concept | Demo equivalent | Why it matters |
|---|---|---|
| Linked service | `DATABASE_URL` / source connection config | Connection abstraction |
| Dataset | SQL table/view schema | Schema-aware movement |
| Pipeline | `etl/reset_and_seed.py` | Ordered workflow |
| Activity | SQL script execution / Python seed step | Unit of work |
| Trigger | Manual script / future cron | Scheduled refresh |
| Integration Runtime | Local/hosted execution context | Network and compute boundary |
| Monitor | Quality views and terminal checks | Operational trust |

## What to say

> I would not pretend this is an ADF deployment. It is a bridge artifact. The business logic, grain, quality gates, and operator workflow are the hard parts to reason through. In production, I would translate the orchestration into ADF linked services, datasets, parameterized pipelines, triggers, retries, monitoring, and Azure security conventions.
