# Prisma + Supabase Project Setup

This project uses **Prisma** as the ORM to manage a PostgreSQL database (e.g., Supabase). This README explains how to set up the project, initialize Prisma, generate the Prisma Client, manage migrations, and deploy changes safely.

---

## 1. Prerequisites

1. Node.js installed (v18+ recommended)
2. A PostgreSQL database (e.g., Supabase)
3. `.env` file in the root of your project containing your database URL:

```env
DATABASE_URL="postgresql://<username>:<password>@<host>:5432/<database>"
```

> Replace `<username>`, `<password>`, `<host>`, and `<database>` with your actual database credentials.

---

## 2. Initialize Prisma

To start using Prisma in your project, run:

```bash
npx prisma init
```

- Creates a `prisma/` folder with `schema.prisma` and a `.env` file (if not already present)
- Prepares your project for database migrations and Prisma Client generation

---

## 3. Generate Prisma Client

After modifying `schema.prisma` or adding new models:

```bash
npx prisma generate
```

- Regenerates the Prisma Client with updated TypeScript types.
- Must run every time the schema changes.

---

## 4. Development Migration

During development, when adding a new model or changing the schema:

```bash
npx prisma migrate dev --name add_post_model
```

- Creates a new migration file in `prisma/migrations`
- Applies the migration to your local database
- Updates Prisma Client automatically
- Replace `add_post_model` with a descriptive name for your migration

---

## 5. Push Schema Directly (Optional)

For quick testing or syncing schema without creating migration files:

```bash
npx prisma db push
```

> ⚠️ Updates the database directly without generating a migration file. Use only in development or test environments.

---

## 6. Deploy Migrations (Production)

In production, apply all pending migrations in order:

```bash
npx prisma migrate deploy
```

- Executes all migration files in `prisma/migrations`
- Ensures production database matches schema
- **Do not use `migrate dev` in production**, as it can create new migrations and risk data consistency

---

## 7. Using the Prisma Client

Example of using a new model in code:

```ts
import { prisma } from '@/libs/prisma/client';

async function main() {
  const newUser = await prisma.user.create({
    data: { email: 'alice@example.com', name: 'Alice' },
  });

  const users = await prisma.user.findMany();
  console.log(users);
}

main();
```

---
