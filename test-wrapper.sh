#!/bin/bash
export NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy"
export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
export DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy"
pnpm test
