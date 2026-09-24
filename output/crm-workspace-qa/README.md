# CRM daily outreach workspace — verification

Implemented in `/admin/crm` on September 24, 2026. Not deployed.

- Active course list, due follow-ups, missing next steps, demo/negotiation view.
- Course owner, search, and explicit Metro Detroit note filters; 12 records per page.
- Existing task, activity and email workflows reused; reads do not queue outreach or mutate contacts.
- Read queries paginate courses and open course tasks to avoid the default database row cap.
- Detroit calendar dates, telephone extensions, responsive admin navigation and accessible task field labels.
- Business overview, stale-lead alerts, activity history and existing CRM tools retained.

## Validation

`npx vitest run --config vitest.crm-workspace.config.ts`: six focused tests passed.

`node output/crm-workspace-qa/build.cjs` then `node output/crm-workspace-qa/check.cjs`: isolated browser fixture passed desktop/mobile layout, search, owner/location/due filters, pagination, empty state, phone links and task submission payload. The fixture renders the actual workspace/task components with sample records and mocked server actions. It does not validate live authentication, database writes, or email delivery. Screenshots are in this directory. Python Playwright was unavailable, so the installed Node Playwright was used.

The shareable outreach playbook was checked in the browser at desktop and phone widths, with all 25 course profiles present.

## Remaining release checks

A full `next build --webpack` fails in the installed Next.js Google font loader: `findFontFilesInCss is not a function`, originating in the unchanged app root layout's font imports. After build generation, `tsc --noEmit` reports an existing unsupported `parseOpenEvent` export in `src/app/api/webhooks/resend/route.ts`. No CRM TypeScript errors remain. These issues need resolution before a production build can be certified.

After the build is healthy, validate the authenticated CRM against a designated test course: create and complete a follow-up, log activity, confirm refresh behavior and owner filters. Sending an actual email was not part of this task's verification.

Research contacts have not been imported into the CRM. Their source and confirmation status must stay attached to them; a published contact is not proof of current purchasing authority.
