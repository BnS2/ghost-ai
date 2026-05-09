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
- Technical Findings Remediation:
    - Refactored AI sidebar state to be responsive and desktop-default in `workspace-view.tsx`.
    - Conditionalized AI toggle button in `editor-navbar.tsx`.
    - Made project sidebar tabs controlled to prevent stale UI in `project-sidebar.tsx`.
    - Hardened identity retrieval and primary email resolution in `lib/project-access.ts`.
- Implemented Liveblocks Setup (feature-specs/10-liveblocks-setup.md). Configured `liveblocks.config.ts`, added a proper cached Liveblocks node client in `lib/liveblocks.ts`, and implemented the `/api/liveblocks-auth` route with project access checks.
- Implemented Base Canvas (feature-specs/11-base-canvas.md). Created `types/canvas.ts` with `canvasNode`/`canvasEdge` types and `CanvasNodeData`. Created `components/editor/canvas-wrapper.tsx` with `LiveblocksProvider`, `RoomProvider`, `ClientSideSuspense`, and class-based ErrorBoundary. Created `components/editor/canvas-flow.tsx` using `useLiveblocksFlow` (suspense mode) wired to `ReactFlow` with `ConnectionMode.Loose`, `fitView`, `MiniMap`, and dot-pattern `Background`. Replaced the canvas placeholder in `workspace-view.tsx` with `<CanvasWrapper>`.
- Implemented Shape Panel (feature-specs/12-shape-panel.md). Added the floating bottom shape toolbar, shape drag payloads, drop-to-create custom canvas nodes, and basic bordered rectangle node rendering.
- Themed the React Flow MiniMap to match the dark editor UI, including token-based surface, border, viewport mask, and node preview colors.

## In Progress
- (none — next: shape-specific node visuals or canvas persistence)

## Open Questions
- Next.js 16.2.4 build fails on `/_global-error` prerendering with `TypeError: Cannot read properties of null (reading 'useContext')`. This is a known Next.js/Clerk version interaction issue unrelated to recent code changes. TypeScript type-check and compile steps pass successfully.

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
- Implemented Share Dialog (feature-specs/09-share-dialog.md):
    - Created `app/api/projects/[projectId]/collaborators` routes for listing, inviting, and removing.
    - Integrated Clerk Backend API for user data enrichment (names, avatars).
    - Created `components/editor/share-dialog.tsx` with rich aesthetics and access control.
    - Wired "Share" button in `EditorNavbar` and managed state in `WorkspaceView`.
    - Handled "Copy Link" with temporary feedback and enforced ownership server-side.
- Implemented Liveblocks Setup (feature-specs/10-liveblocks-setup.md):
    - Configured `liveblocks.config.ts` with `Presence` (cursor, isThinking) and `UserMeta`.
    - Finalized the cached `@liveblocks/node` client in `lib/liveblocks.ts` using the global caching pattern to prevent hot-reload memory leaks.
    - Created `POST /api/liveblocks-auth` to securely generate Liveblocks session tokens using project access verification.
    - Added `export const dynamic = "force-dynamic";` to `/api/projects/[projectId]/collaborators` routes to prevent Next.js from attempting static generation on authenticated routes.
- Implemented Base Canvas (feature-specs/11-base-canvas.md):
    - Added `types/canvas.ts` with `CanvasNodeData`, `canvasNode`, and `canvasEdge` types.
    - Created `components/editor/canvas-wrapper.tsx`: wraps the Liveblocks `LiveblocksProvider` + `RoomProvider` with `initialPresence { cursor: null, isThinking: false }`, a `ClientSideSuspense` loading fallback, and a class-based `ErrorBoundary` for connection errors.
    - Created `components/editor/canvas-flow.tsx`: uses `useLiveblocksFlow<canvasNode, canvasEdge>({ suspense: true })` and renders a `ReactFlow` with `ConnectionMode.Loose`, `fitView`, dot-pattern `Background`, and `MiniMap`.
    - Replaced the canvas placeholder in `workspace-view.tsx` with `<CanvasWrapper projectId={project.id} />`.
    - `npm run build` TypeScript and compile steps pass cleanly.
- Implemented Shape Panel (feature-specs/12-shape-panel.md):
    - Added central canvas shape, color, and drag payload contracts.
    - Added a floating bottom shape panel with draggable rectangle, diamond, circle, pill, cylinder, and hexagon buttons.
    - Wired React Flow dragover/drop handling to create custom nodes from the drag payload using screen-to-canvas coordinate conversion.
    - Added the basic custom node renderer for visible bordered rectangle nodes with centered labels.
- Themed the canvas MiniMap in `components/editor/canvas-flow.tsx`:
    - Set the preview background, border, and viewport mask to dark UI tokens.
    - Mirrored canvas node fill colors in the MiniMap node previews.
    - Verified with `npx tsc --noEmit`; `npm run build` still reaches the known Next.js/Clerk prerender failure after compile and TypeScript.
