
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Supply Chain Verde project conventions

### Architecture

- Organize the application by feature under `src/app/features`, not by technical layer.
- Keep application-wide singletons in `src/app/core` (session, guards, and interceptors).
- Keep reusable UI in `src/app/shared/components`.
- Use standalone components and lazy-loaded feature routes; do not introduce `NgModule`.
- Use Angular 21, Tailwind CSS, Reactive Forms, and the default Angular unit test runner.
- Use Cypress for the planned end-to-end flows.

### State and API boundaries

- Use signals and feature services for state; do not add NgRx for CRUD screens.
- Use functional `CanActivateFn` guards and functional `HttpInterceptorFn` interceptors.
- Store the JWT in `sessionStorage`; do not use `localStorage`.
- The auth interceptor attaches `Authorization: Bearer <token>` and logs out on global `401`/`403`.
- Use `zod` schemas at API boundaries to validate response payloads and infer TypeScript types.
- Define backend enums with `z.enum(...)` so the same schema provides types and select options.
- Validate Reactive Forms with Angular validators; do not force a React-only Zod resolver pattern.
- Treat backend `LocalDate` and `LocalDateTime` values as ISO strings in schemas and format them at
  the presentation boundary.

### File and component conventions

- Use `index.service.ts`, `index.schema.ts`, `index.guard.ts`, and `index.interceptor.ts` inside
  the owning feature or core directory.
- Components use `index.component.ts`, `index.component.html`, and adjacent `index.component.spec.ts`.
- Prefer `input()` and `output()` over decorator-based inputs and outputs.
- Use native Angular control flow (`@if`, `@for`, `@switch`) in templates.
- Use `[class]` and `[style]` bindings instead of `ngClass` and `ngStyle`.
- Use `ChangeDetectionStrategy.OnPush` and keep components focused.
- Use `NgOptimizedImage` for static images where applicable.

### Accessibility and scope

- Every user-facing surface must meet WCAG AA and pass AXE checks, including keyboard focus,
  semantic controls, labels, error messaging, and sufficient color contrast.
- The public traceability route is `/rastreio/:batchId`; authenticated routes must use the session
  and role guards.
- Do not add refresh-token behavior, public supplier self-registration, PDF/CSV export, or elaborate
  dashboards unless the scope is explicitly expanded.
