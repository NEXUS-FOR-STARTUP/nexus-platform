---
created: 2026-09-23
kind: planning
plan: plans/260923-1604-completed-case-credit-lock
---

# Completed-case credit lock plan

## Context

Student completion was immediate. Completed workspace still exposed buy-credit CTA.

## Decision

Plan only frontend behavior: Mantine completion warning plus hidden purchase CTAs after case data becomes `completed`. API/order behavior stays unchanged.


## Next

Cook two phases: completion UX, then UI verification.