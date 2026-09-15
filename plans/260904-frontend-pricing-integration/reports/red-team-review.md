# Red Team Plan Review: 260904-frontend-pricing-integration

## 1. Adversarial Findings
- **Vulnerability**: Phase 4 suggests pointing generic dashboard CTAs back to a `#pricing` anchor on the landing page. This is poor UX for a logged-in user on the dashboard. They shouldn't be kicked out to the public landing page to initiate a flow. 
- **Fix Required**: Instead of kicking users back to the landing page, the dashboard should have a simple package selection modal, or a dedicated `/dashboard/pricing` route, or default the CTA to the primary tier (149k) and let them downgrade in the intake flow. For simplicity in this plan, updating the CTAs to default to `pkg_supporter_audit` or opening a native Mantine modal is better than an external anchor link.

- **Vulnerability**: What happens to users who already purchased `pkg_tf_audit`? If they revisit a draft or have a pending case, and the seed deactivates it (`is_active = false`), will the API crash when fetching case details?
- **Fix Required**: Phase 1 must ensure `seed-active-packages.ts` still seeds the old packages as `is_active: false` (so their data exists for joins), but the frontend queries MUST NOT display them for new purchases. The frontend `GET /packages` must filter out inactive packages, or the backend should.

## 2. Conclusion
The UI-first approach is solid and safe, but Phase 4 UX and legacy data handling in Phase 1 require the adjustments noted above during the 'cook' phase.