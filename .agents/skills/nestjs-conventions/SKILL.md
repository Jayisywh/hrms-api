---
name: nestjs-conventions
description: NestJS framework and project conventions for this HRMS API, covering module layout, dependency injection, controllers, services, DTO validation, guards, and error handling. Use when creating or modifying NestJS modules, endpoints, providers, or DTOs in this codebase. Triggers on "NestJS", "controller", "service", "module", "DTO", "dependency injection".
metadata:
  author: hrms-api
  version: "1.0.0"
---

# NestJS Project Conventions

Conventions for building features in this NestJS 11 API. Follow these exactly when adding or editing modules so new code matches the existing style.

## Feature Module Layout

Each feature lives under `src/<feature>/` with this structure:

```
src/<feature>/
├── <feature>.module.ts      # @Module declaration
├── <feature>.controller.ts  # HTTP layer (routes)
├── <feature>.service.ts     # business logic
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
└── <feature>.controller.spec.ts / <feature>.service.spec.ts  # unit tests
```

Existing features: `users`, `auth`, `departments`, `positions`. Register new feature modules in `src/app.module.ts` imports.

## Module Definition Pattern

- Each feature module imports `PrismaModule` to get `PrismaService` (see `departments.module.ts` for the canonical example).
- Controllers and services are declared as `controllers` / `providers` in the `@Module` decorator.
- `PrismaModule` exports `PrismaService`; it is imported per-feature (not global).

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
```

## Controllers

- Route prefix via `@Controller('<feature-plural>')`.
- Methods are thin: delegate to the service, keep HTTP concerns (params/query/body) in the controller.
- Use standard decorators: `@Get() @Get(':id') @Post() @Patch(':id') @Delete(':id')`, plus `@Param('id')`, `@Query('search')`, `@Body()`.
- Do not put business logic or Prisma calls in controllers — that belongs in the service.

## Services

- Marked `@Injectable()`; dependencies injected via constructor, e.g. `constructor(private readonly prisma: PrismaService)`.
- `private readonly` for all injected dependencies.
- Use `PrismaService` for all data access (never import `PrismaClient` directly).
- Validation-first style: verify a record exists before update/delete, and enforce uniqueness before create (see `departments.service.ts`).

## Dependencies Injection (DI)

- Constructor injection with `private readonly` is the required idiom across this repo — do not use field injection or `@Inject()` without reason.
- Feature services and guards that need the database take `PrismaService`.

## DTO Validation

- DTOs are plain classes using `class-validator` decorators (`@IsString()`, `@IsOptional()`, `@IsEmail()`, etc.).
- `UpdateXxxDto` typically extends `PartialType(CreateXxxDto)` from `@nestjs/mapped-types` so all fields are optional.
- Validation runs at the controller boundary; services assume validated input.

## Error Handling

- Use built-in Nest exceptions with clear messages:
  - `NotFoundException` — record missing.
  - `ConflictException` — uniqueness / FK conflicts (e.g. duplicate code/name, or deleting a department with assigned records).
  - `UnauthorizedException` — auth failures.
- Throw from services; let Nest handle the HTTP response mapping.

## Authorization

- `JwtAuthGuard` protects a route with `@UseGuards(JwtAuthGuard)`.
- `RoleGuard` + `@Roles(...)` restrict by role. See the `auth-rbac` skill for the full flow and wiring.

## Tests

- Unit specs: `*.spec.ts` colocated next to the implementation, run via `npm run test` (Jest, `testRegex: .*\\.spec\\.ts$`, rootDir `src`).
- E2E specs live under `test/`, run via `npm run test:e2e`.

## Commands

- `npm run start:dev` — watch mode.
- `npm run lint` — lint (auto-fix).
- `npm run build` — type-check + compile.
- `npm run test` / `npm run test:e2e`.

## How to Use

When adding a feature: create the module folder + files following this layout, wire it into `app.module.ts`, put all DB logic in the service via `PrismaService`, validate with class-validator DTOs, and add a colocated unit test.
