# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation

## Current Goal
- Canvas foundation and node-based editing.

## Completed
- Project context and architecture definition.
- Design System implementation (shadcn/ui, lucide-react, base utilities, custom tokens).
- Editor Chrome implementation (Navbar, Sidebar, Layout state).
- Authentication implementation (Clerk integration, proxy-based route protection, themed auth pages).
- Editor Home and Project Dialogs (feature-specs/04-project-dialogs.md).
- Prisma setup and data models (feature-specs/05-prisma-specs.md). Implemented models, client singleton with driver adapter branching, and integrated varlock for env management. Migration `init` applied successfully.
- Project API Implementation (feature-specs/06-project-apis.md). Implemented list, create, rename, and delete endpoints with Clerk authentication and ownership checks.
- Wire the editor home sidebar and dialogs to the real project API (feature-specs/07-wire-editor-home.md). Wired mutations, server-side fetching, and workspace navigation.
- Editor Workspace Shell (feature-specs/08-editor-workspace-shell.md). Implemented layout, access checks, and active project highlighting.

## In Progress
- Canvas foundation and node-based editing.

## Open Questions
- Add unresolved product or implementation questions here.

## Architecture Decisions
- Add decisions that affect the system design or data model.

## Session Notes
- Completed Editor Home and Project Dialogs implementation.
- Wired sidebar actions (Rename, Delete) and New Project button.
- Implemented slug preview logic in Create Project dialog.
- Verified accessibility (backdropScrim, ARIA labels, focus management).
- Refactored ProjectDialogs to use sub-components and keys for state reset, avoiding synchronous setState in effects.
- Fixed accessibility violations in ProjectSidebar (interactive static elements, missing keyboard handlers).
- Audited all shadcn/ui components (Button, Card, Dialog, Input, Textarea, Tabs, ScrollArea) against ui-context.md. Replaced shadcn alias tokens with direct design system tokens and removed unnecessary dark: variants.
- Next session should focus on the Canvas foundation and React Flow integration.
- Refactored PrismaClient initialization in `lib/prisma.ts` to use idiomatic Prisma v7 driver adapter pattern (direct connection string to `PrismaPg`).
- Enforced `varlock` for environment variables project-wide and updated `code-standards.md`.
- Implemented Project API routes (`GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/[projectId]`, `DELETE /api/projects/[projectId]`).
- Enforced Clerk authentication and ownership validation.
- Resolved Prisma v7 type compatibility issues by casting the singleton to the base `PrismaClient` type, avoiding `any` and adhering to `code-standards.md`.
- Verified that TypeScript checks pass during `npm run build`.
- Wired the editor home sidebar and dialogs to the real project API.
- Implemented `useProjectActions` hook for centralized mutation management.
- Refactored `app/editor/page.tsx` to a Server Component for initial data fetching.
- Added redirection logic when deleting the active workspace.
- Hardened Project API (`POST /api/projects`) with robust input validation and strict ID formatting.
- Enforced project-level authorization in the workspace page (`app/editor/[projectId]/page.tsx`) by verifying ownership or collaboration status.
- Optimized `EditorView` performance by memoizing the project list to prevent redundant sidebar re-renders.
- Hardened codebase with several technical debt fixes:
    - Removed magic sentinel strings from project authorization queries.
    - Switched to functional state updaters for sidebar toggle logic.
    - Improved suffix handling with nullish coalescing and `useMemo` for stability and React purity.
- Set up pre-commit hook pipeline: installed `@biomejs/biome`, `simple-git-hooks`, and `lint-staged` as devDependencies. Configured `biome.json` with project-tuned formatter/linter rules. Wired `simple-git-hooks` → `lint-staged` → `biome check --write` for staged `.ts/.tsx/.js/.jsx/.json` files. Added GitHub Actions CI workflow (`.github/workflows/ci.yml`) running `biome ci` on push/PR to main.
- Implemented Editor Workspace Shell (08-editor-workspace-shell.md):
    - Created `lib/project-access.ts` for centralized identity and access management.
    - Created `components/editor/access-denied.tsx` for unauthorized or non-existent projects.
    - Updated `EditorNavbar` with project name display and share/AI actions.
    - Updated `ProjectSidebar` to support active project highlighting.
    - Refactored `app/editor/[projectId]` to use Server Component access checks and the full-viewport shell layout.
