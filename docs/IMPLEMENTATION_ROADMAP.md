# BEM FT UNESA Digital Ecosystem Implementation Roadmap

This roadmap is derived from the existing module documents in `docs/api`, `docs/ims`, `docs/public`, `docs/or`, `docs/pkkmb`, and `docs/shop`. Those documents remain the source of truth for product and architecture decisions.

## 1. Ecosystem Analysis

- The ecosystem is a Turborepo monorepo with a centralized NestJS API and multiple Next.js frontends.
- The API owns auth, RBAC, scoped permissions, workflows, audit logging, notifications, document verification, finance ledger, recruitment, PKKMB, shop, and CMS data.
- Frontends must render by permission, not by hardcoded role checks.
- IMS is the operating console for finance, committee lifecycle, workflow review, audit trails, workload analytics, and CMS.
- Public, OR, Shop, and PKKMB are bounded portals that consume the Central API.

## 2. Dependency Architecture

Foundation package order:

1. `@bemft/types`: shared domain contracts, enums, workflow states, auth payloads, finance/document contracts.
2. `@bemft/utils`: shared formatting, class names, date, and object helpers.
3. `@bemft/config`: environment normalization for apps and API.
4. `@bemft/database`: collection names and persistence contracts.
5. `@bemft/permissions`: policy catalog, role grants, scoped permission engine.
6. `@bemft/workflow`: configurable workflow definitions and transition engine.
7. `@bemft/auth`: shared auth/session/MFA contracts.
8. `@bemft/ui`: reusable dashboard UI and permission rendering primitives.
9. `@bemft/api-client`: HTTP client for frontends.
10. Application packages consume only the shared packages they need.

## 3. Monorepo Setup Plan

- Keep `apps/api`, `apps/public`, and `apps/ims` as existing apps.
- Add missing shared foundation packages under `packages/*`.
- Add future app shells for `apps/or`, `apps/shop`, and `apps/pkkmb` after the foundation layer is stable.
- Make package builds run before app builds through Turborepo dependency edges.
- Keep all shared UI in `packages/ui` and remove duplicated app-local UI over time.

## 4. Database Implementation Order

1. Security foundation: users, roles, permissions, role permissions, user roles, direct user permissions, sessions, trusted devices.
2. Audit foundation: immutable audit logs and event metadata.
3. Workflow foundation: workflow definitions, workflow instances, transition history.
4. Organization core: departments, proker, committees, lifecycle states.
5. Documents: documents, proposals, LPJ, RAB, version snapshots.
6. Finance: department allocations, RAB items, item approvals, ledger entries.
7. Public CMS: articles, gallery, aspirations, verification records.
8. Recruitment: applicants, scores, schedules, auto-provisioning hooks.
9. Shop: products, variants, orders, payment webhooks, finance sync.
10. PKKMB: participants, tasks, submissions, attendance, scoring.

## 5. API Implementation Priority

1. API bootstrap, config, database, Redis, throttling, validation, response envelope.
2. Auth: JWT, refresh tokens, MFA, trusted devices, session revocation.
3. Permission guard: `@RequirePermissions`, scoped policy resolution, audit events for denied mutations.
4. Workflow engine endpoints: definitions, instances, transitions, history.
5. Audit log service and append-only mutation logging.
6. IMS core modules: users, roles, permissions, committees, proker.
7. Finance core: allocations, RAB item approval, ledger.
8. Documents and versioning.
9. Public CMS and verification endpoints.
10. OR, Shop, and PKKMB domain APIs.

## 6. Frontend Implementation Priority

1. Shared UI primitives and dashboard shell from `@bemft/ui`.
2. Shared permission rendering with hidden, disabled, read-only, and scoped states.
3. IMS auth/session provider.
4. IMS dashboard navigation filtered by permissions.
5. IMS admin for users, roles, policies, workflows.
6. IMS committee/proker lifecycle views.
7. IMS finance, ledger, RAB item approval.
8. IMS document versioning and audit views.
9. Public CMS consuming ISR-safe public endpoints.
10. OR, Shop, and PKKMB portals after core authorization and workflow contracts are stable.

## 7. RBAC Implementation Plan

- Support static roles as baseline role definitions.
- Support dynamic roles via scoped `user_roles` assignments.
- Resolve effective permissions from direct grants, inherited grants, and scoped role grants.
- Deny grants override allow grants.
- UI consumes permission decisions and renders hidden, disabled, read-only, or allowed states.
- API enforces `@RequirePermissions` using the same policy engine.

## 8. Workflow Engine Plan

- Store workflow definitions as JSON-compatible documents.
- Drive transitions through workflow definitions, not hardcoded approval branches.
- Track every transition in workflow instance history.
- Seed default definitions for proposal approval, LPJ validation, finance approval, archive workflow, and committee lifecycle.
- Let IMS expose workflow policy management after the foundation guard is stable.

## 9. Recommended Folder Structure

```txt
apps/
  api/
    src/
      auth/
      permissions/
      workflow/
      audit/
      database/
      ims/
      public/
      recruitment/
      shop/
      pkkmb/
  ims/
  public/
  or/
  shop/
  pkkmb/
packages/
  ui/
  auth/
  database/
  permissions/
  workflow/
  analytics/
  types/
  config/
  utils/
  api-client/
```

## 10. Foundation Definition Of Stable

- Shared packages build successfully.
- API can load security/workflow/audit schemas.
- API has a reusable permission guard and decorator.
- Permission and workflow logic lives in shared packages, not individual controllers.
- Existing apps continue to build or expose any current incompatibilities clearly.
