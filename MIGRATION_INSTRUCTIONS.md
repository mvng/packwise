# Luggage Management Migration Instructions

## ⚠️ IMPORTANT: Run Migration BEFORE Merging This PR

This PR adds database schema changes that require a migration. **DO NOT merge until the migration is successfully applied to production.**

## Local Development

1. Create the migration:
```bash
npx prisma migrate dev --name add_luggage_management
```

2. Verify it works:
```bash
npm run dev
```

## Production Deployment (Supabase)

### Step 1: Get Your Connection Strings

1. Go to Supabase Dashboard → Settings → Database
2. Copy both connection strings:
   - **Connection string** (direct, port 5432)
   - **Connection pooling string** (pooled, port 6543)

### Step 2: Update Environment Variables

Add to your `.env` (locally) and Vercel/production environment:

```bash
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

### Step 3: Apply Migration to Production

```bash
npx prisma migrate deploy
```

This command:
- ✅ Only runs pending migrations
- ✅ Safe for production
- ✅ Won't create new migrations

### Step 4: Verify Migration

Check Supabase Dashboard → Database → Tables. You should see:
- `luggage` table
- `trip_luggage` table
- `packing_items` table has new `trip_luggage_id` column

### Step 5: Update Vercel Build Command (Optional)

To auto-run migrations on deploy:

```bash
npx prisma generate && npx prisma migrate deploy && next build
```

## After Migration is Applied

✅ Now you can safely merge this PR

## Rollback (If Needed)

If something goes wrong:

1. Revert the migration in Supabase:
   - Go to SQL Editor
   - Run the down migration (DROP tables)

2. Delete the migration file from `prisma/migrations/`

3. Regenerate client:
```bash
npx prisma generate
```

## What This Migration Adds

- **luggage table**: Stores user's bags (name, type, capacity)
- **trip_luggage table**: Links luggage to trips (many-to-many with active status)
- **packing_items.trip_luggage_id**: Optional FK to assign items to bags

## Example Usage After Deployment

1. User creates luggage: "20L Aer Pro Pack", "Rimowa Check-In"
2. On trip detail page, user selects which bags to bring
3. While packing, user assigns each item to a specific bag
4. View items grouped by luggage
