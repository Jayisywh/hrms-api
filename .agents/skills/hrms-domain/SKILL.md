---
name: hrms-domain
description: HRMS domain model reference for this project covering User, Employee, Department, and Position entities plus their enums (Role, EmploymentType, EmployeeStatus) and business rules. Use when modeling, querying, or updating HR entities, writing Prisma queries against these models, or enforcing domain constraints and relationships. Triggers on "employee", "department", "position", "user model", "role", "HR rule".
metadata:
  author: hrms-api
  version: "1.0.0"
---

# HRMS Domain Model

Reference for the domain entities defined in `prisma/schema.prisma`. Use this before querying or mutating HR entities with Prisma so relationships, unique constraints, and business rules are respected.

## Entities and Relationships

### User (`prisma.user`)
- Authentication identity. Has `email` (unique) and hashed `password`.
- `role: Role` defaults to `EMPLOYEE`; `isActive: Boolean` defaults to `true`; `userId` unique on Employee.
- Related to exactly one `Employee` (optional, one-to-one).

### Department (`prisma.department`)
- Org unit with unique `code` and unique `name`; optional `description`; `isActive` defaults to `true`.
- Owns many `Position`s and many `Employee`s.
- Referential rule: positions/employees reference it with `onDelete: Restrict` — a department with assigned positions or employees **cannot** be deleted.

### Position (`prisma.position`)
- Job role within a department; unique `code`, required `name`, optional `description`, `isActive`.
- Required `departmentId` relation (`onDelete: Restrict`).
- Composite unique `@@unique([departmentId, name])` — a department cannot have two positions with the same name. Indexed on `departmentId`.
- Holds many `Employee`s.

### Employee (`prisma.employee`)
- Core HR record. Unique `employeeCode`; `firstName`, `lastName`; optional `phone`, `address`, `dateOfBirth`; required `hireDate`.
- `employmentType: EmploymentType` defaults `FULL_TIME`; `status: EmployeeStatus` defaults `ACTIVE`.
- Relations:
  - `user` (optional, one-to-one, `onDelete: Restrict` on `userId`).
  - `department` (required, `onDelete: Restrict`).
  - `position` (required, `onDelete: Restrict`).
  - `manager`/`subordinates` — self-relation `"EmployeeManager"` via `managerId` (`onDelete: SetNull`), so deleting a manager does **not** delete their subordinates, it nulls `managerId`.
- Indexed on `departmentId`, `positionId`, `managerId`, `status`.

## Enums

### Role
`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE` — authorization levels. Import from `generated/prisma/enums`. See `auth-rbac` skill for how roles gate endpoints.

### EmploymentType
`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`

### EmployeeStatus
`ACTIVE`, `INACTIVE`, `ON_LEAVE`, `TERMINATED`

## Business Rules Checklist

- Before creating a `Department`, verify `code` and `name` are unique (throw `ConflictException` otherwise).
- Before creating a `Position`, verify `code` uniqueness and the `[departmentId, name]` composite uniqueness.
- Before deleting a `Department`, check it has no assigned `employees` or `positions` (use `_count`) — deletion is blocked otherwise.
- Deleting a `manager` sets subordinates' `managerId` to null (do not cascade-delete subordinates).
- User deletion is restricted when an `Employee` references it.

## How to Use

Open `prisma/schema.prisma` for the authoritative definition. Use `prisma-client-api` for query syntax and `prisma-cli` for migrations. Keep domain changes in sync with E2E/unit tests under `test/`.
