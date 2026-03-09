-- Migration: add pack_last to packing_items table
-- Items flagged as pack_last appear in the "Morning of Departure" checklist
-- and are intended to be packed right before leaving (e.g. toothbrush, charger)

ALTER TABLE "packing_items" ADD COLUMN IF NOT EXISTS "pack_last" BOOLEAN NOT NULL DEFAULT false;
