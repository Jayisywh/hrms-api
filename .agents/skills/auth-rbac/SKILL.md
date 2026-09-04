---
name: auth-rbac
description: JWT authentication and role-based access control (RBAC) flow for this HRMS API, covering JwtAuthGuard, RoleGuard, the @Roles decorator, and the login flow. Use when adding, debugging, or securing an authenticated or role-restricted endpoint. Triggers on "auth", "login", "JWT", "guard", "roles", "RBAC", "permission".
metadata:
  author: hrms-api
  version: "1.0.0"
---

# Authentication & Role-Based Access Control (RBAC)

The security layer of this HRMS API: JWT issuance on login, `JwtAuthGuard` for authentication, and `RoleGuard` + `@Roles(...)` for authorization.

## Login Flow (`AuthService.login`)

`src/auth/auth.service.ts`:
1. Look up user by email (`userService.findByEmailForAuth`); throw `NotFoundException` if missing.
2. Reject if `user.isActive === false` (throw `UnauthorizedException`).
3. `bcrypt.compare(password, user.password)`; throw `UnauthorizedException` on mismatch.
4. Build JWT payload `{ sub: user.id, role: user.role }` and sign with `jwtService.signAsync(payload)`.
5. Return `{ accessToken }`.

## JWT Configuration

- Uses `@nestjs/jwt` (`JwtModule` registered in `AuthModule`).
- Signing secret: `process.env.JWT_SECRET`. Same secret used for verification.
- Token format: `Authorization: Bearer <token>`.

## Authentication Guard (`JwtAuthGuard`)

`src/auth/guard/jwt-auth.guard.ts` implements `CanActivate`:
- Reads `Authorization: Bearer <token>` from the header; throws `UnauthorizedException` if the header is missing or not a valid Bearer token.
- `jwtService.verifyAsync(payload, { secret: process.env.JWT_SECRET })`.
- On success sets `request.user = { id: payload.sub, role: payload.role }`.
- On failure throws `UnauthorizedException('Invalid or expire token')`.

Use `@UseGuards(JwtAuthGuard)` on a controller or handler to require an authenticated user.

## Authorization Guard (`RoleGuard`)

`src/common/guards/role.guard.ts` implements `CanActivate`:
- Uses `Reflector` to read role metadata set by `@Roles(...)`.
- If no roles are required on the handler/class, access is allowed (`return true`).
- Otherwise requires `request.user` and that `user.role` is included in the required roles.

Run **after** `JwtAuthGuard` so `request.user` is populated.

## Roles Decorator

`src/common/decorators/roles.decorator.ts`:
- `Roles(...roles: Role[])` calls `SetMetadata(ROLES_KEYS, roles)`.
- `ROLES_KEYS = 'roles'`.
- `Role` type imported from `generated/prisma/enums` (values: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`).

## Guarding a New Endpoint (Recipe)

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '<path>/auth/guard/jwt-auth.guard';
import { RoleGuard } from '<path>/common/guards/role.guard';
import { Roles } from '<path>/common/decorators/roles.decorator';
import { Role } from '<path>/generated/prisma/enums';

@Controller('positions')
export class PositionsController {
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() dto: CreatePositionDto) {
    return this.positionsService.createPosition(dto);
  }
}
```

## Rules & Invariants

- Always guard with **both** `JwtAuthGuard` and `RoleGuard` when role-restricting; `RoleGuard` expects `request.user` set by `JwtAuthGuard`.
- Place `@Roles(...)` on the same handler (or class) as `@UseGuards(...)`.
- Import `Role` from the generated enums, never use raw strings.
- Public endpoints (e.g. `login`) must NOT have `JwtAuthGuard`.
- JWT secret must be present in the environment; never hardcode or commit it.

## How to Use

To add a protected route: import the two guards + decorator, apply `@UseGuards(JwtAuthGuard, RoleGuard)` and `@Roles(...)`, and follow the recipe above. For changes to token claims, update `AuthService.login` and `JwtAuthGuard` together.
