-- Migration: add capacity_liters to luggage table
-- Used by the Outfit Planner luggage fit check feature
-- This is a non-breaking, nullable column addition

ALTER TABLE "luggage" ADD COLUMN IF NOT EXISTS "capacity_liters" DOUBLE PRECISION;

-- Backfill: if existing luggage rows have a numeric `capacity` value,
-- copy it into capacity_liters as a reasonable default (assumes capacity was already in liters)
UPDATE "luggage"
SET "capacity_liters" = CAST("capacity" AS DOUBLE PRECISION)
WHERE "capacity" IS NOT NULL AND "capacity_liters" IS NULL;
