# Inventory Feature Setup

After pulling the `feature/user-inventory` branch, you need to apply the database migration and regenerate the Prisma Client.

## Required Steps

### 1. Apply the database migration

Run this command to create the `inventory_categories` and `inventory_items` tables:

```bash
npx prisma migrate dev --name add_inventory
```

This will:
- Create the migration SQL file in `prisma/migrations/`
- Apply it to your database
- Automatically run `prisma generate`

**Alternative: Manual SQL (if migration fails)**

If you prefer to apply the SQL directly in Supabase SQL Editor:

```sql
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_categories_user_id_idx" ON "inventory_categories"("user_id");
CREATE INDEX "inventory_items_category_id_idx" ON "inventory_items"("category_id");

ALTER TABLE "inventory_categories"
  ADD CONSTRAINT "inventory_categories_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Then regenerate the client:

```bash
npx prisma generate
```

### 2. Restart your dev server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 3. Test the feature

Navigate to:
- `http://localhost:3000/inventory` (requires login)

You should see:
- 5 default categories pre-seeded
- Empty state with instructions
- No errors in console

---

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'findMany')"

**Cause:** Prisma Client wasn't regenerated after schema changes.

**Fix:**
```bash
npx prisma generate
# Restart dev server
```

### Error: "Authentication failed against database server"

**Cause:** `DATABASE_URL` in `.env` is missing or incorrect.

**Fix:**
1. Go to Supabase Dashboard → Settings → Database
2. Copy the **Connection Pooling** string (port `6543`)
3. Replace `[YOUR-PASSWORD]` with your actual password
4. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
5. Restart dev server

### Migration fails: "Unique constraint failed"

**Cause:** Tables already exist from a previous attempt.

**Fix:**
```bash
# Drop tables in Supabase SQL Editor
DROP TABLE IF EXISTS "inventory_items" CASCADE;
DROP TABLE IF EXISTS "inventory_categories" CASCADE;

# Re-run migration
npx prisma migrate dev --name add_inventory
```

### Vercel deployment fails

**Cause:** `DATABASE_URL` not set in Vercel environment variables.

**Fix:**
1. Go to Vercel project settings → Environment Variables
2. Add `DATABASE_URL` with your Supabase connection string
3. Redeploy

---

## Verification Checklist

- [ ] `npx prisma migrate dev` completed successfully
- [ ] `npx prisma generate` ran without errors
- [ ] Dev server restarted
- [ ] `/inventory` page loads without console errors
- [ ] 5 default categories appear on first visit
- [ ] Can create/edit/delete items
- [ ] "Add from Inventory" button appears on trip pages
