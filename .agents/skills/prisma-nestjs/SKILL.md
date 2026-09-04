---
name: prisma-nestjs
description: How this HRMS API wires Prisma ORM 7 into NestJS, covering PrismaService with the PrismaPg driver adapter, the generated client location, PrismaModule, and query/dependency patterns. Use when working with the Prisma client, PrismaService, database access from NestJS services, migrations, or the schema. Triggers on "PrismaService", "prisma client", "driver adapter", "PrismaPg", "generated prisma", "migration".
metadata:
  author: hrms-api
  version: '1.0.0'
---

# Prisma in NestJS (Project Wire-up)

p
How Prisma ORM 7 is configured and used inside this NestJS app. Use this for anything Prisma-related in this repo. For full query/CLI reference, use the installed `prisma-client-api` and `prisma-cli` skills — this skill covers the project-specific plumbing.

## PrismaService

`src/prisma.service.ts` is the single data-access provider:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }
}
```

Key points:

- `PrismaService extends PrismaClient` — inject it and call client methods directly.
- Uses the **driver adapter** (`@prisma/adapter-pg` + `PrismaPg`), required in Prisma 7.
- Connection string comes from `process.env.DATABASE_URL`.

## PrismaModule

`src/prisma.module.ts` declares `PrismaService` as a provider and exports it. Each feature module imports `PrismaModule` to obtain `PrismaService` (see `departments.module.ts`). Import `PrismaModule` rather than adding `PrismaService` directly to each feature.

## Generated Client Location

- Client is generated to `src/generated/prisma` (set by `output` in `generator client`).
- Import from the generated path: `import { PrismaClient } from './generated/prisma/client.js'`.
- Enums (e.g. `Role`) import from `generated/prisma/enums`.
- `/src/generated/prisma` is git-ignored — run `prisma generate` to produce it.

## Usage in Services

Inject via constructor: `constructor(private readonly prisma: PrismaService)`. Example from `departments.service.ts`:

```typescript
@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllDepartments(search?: string) {
    return this.prisma.department.findMany({
      where: search
        ? { OR: [{ code: { contains: search, mode: 'insensitive' } }] }
        : {},
    });
  }
}
```

Rules:

- Always access the DB through `PrismaService`, never instantiate `PrismaClient` in services.
- Prefer explicit `where` with unique fields and handle "not found" with `NotFoundException`.

## Schema & Migrations

- Schema: `prisma/schema.prisma` (provider `postgresql`).
- Config: `prisma.config.ts`.
- Migrations under `prisma/migrations/`.
- After schema changes: `npx prisma migrate dev --name <name>` then `npx prisma generate`.
- See `prisma-cli` skill for CLI details and `prisma-client-api` for query/filter/transaction syntax.

## Common Prisma 7 Notes

- Driver adapters are mandatory (no `DATABASE_URL` auto-loading by the client); `PrismaPg` is wired in `PrismaService`.
- Use `@prisma/adapter-pg` + `pg` (already dependencies).
- Transaction/query APIs follow `prisma-client-api` skill.

## How to Use

For data access in any feature service: inject `PrismaService`, call the model methods (`findMany`, `create`, `update`, `delete`, `_count`, etc.), and reference `prisma-client-api` for syntax. For schema/migration work, edit `prisma/schema.prisma`, run `migrate dev`, then `generate`. For CLI/config details, use the `prisma-cli` skill.
