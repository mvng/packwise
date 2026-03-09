# Migration Instructions

## Running Migrations

This project uses Prisma with a PostgreSQL database (hosted on Supabase).

### Development

```bash
npx prisma migrate dev
```

### Production

```bash
npx prisma migrate deploy
```

### After adding new models or fields

```bash
npx prisma generate
```

---

## Migration: `add_capacity_liters_to_luggage` (2026-03-09)

**File:** `prisma/migrations/20260309_add_capacity_liters_to_luggage/migration.sql`

**What it does:**
- Adds a nullable `capacity_liters` (`DOUBLE PRECISION`) column to the `luggage` table
- Backfills from the existing `capacity` (Int?) column where available
- Used by the **Outfit Planner** `LuggageFitCheck` component to estimate whether selected outfits fit in your trip luggage

**How to apply manually (Supabase SQL Editor):**

```sql
ALTER TABLE "luggage" ADD COLUMN IF NOT EXISTS "capacity_liters" DOUBLE PRECISION;

UPDATE "luggage"
SET "capacity_liters" = CAST("capacity" AS DOUBLE PRECISION)
WHERE "capacity" IS NOT NULL AND "capacity_liters" IS NULL;
```

**To populate for existing luggage entries**, go to the Luggage settings page in Packwise and enter the capacity in liters for each bag. Common values:

| Bag | Liters |
|---|---|
| Aer Travel Pack 20L | 20 |
| Rimowa Essential Check-In M | 38 |
| Rimowa Essential Check-In L | 52 |
| Rimowa Essential Check-In XL | 84 |
| Rimowa Classic Trunk | 90 |
