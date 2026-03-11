// Wait, if I use `redirect('/dashboard')` from `next/navigation`, will it cause issues because the return type of `GET` expects a `Response`?
// In Next.js App Router Route Handlers, if `redirect` throws a `NEXT_REDIRECT` error, Next.js handles it internally and correctly returns a 307 response to the client.
// So `export async function GET(request: Request)` can just execute `redirect(...)`.
// But wait, what if `exchangeCodeForSession` fails?
// We need to `redirect(/login?error=...)`.

// Let's modify `app/auth/callback/route.ts` to use `redirect` from `next/navigation`.

import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('app/auth/callback/route.ts', 'utf8');
content = `import { redirect } from 'next/navigation'\n` + content;
content = content.replace(/import { NextResponse } from 'next\/server'\n/g, '');
content = content.replace(/const origin = requestUrl.origin\n/g, '');
content = content.replace(/return NextResponse\.redirect\(`\$\{origin\}\/login\?error=\$\{encodeURIComponent\(error\.message\)\}`\)/g, 'redirect(`/login?error=${encodeURIComponent(error.message)}`)');
content = content.replace(/return NextResponse\.redirect\(`\$\{origin\}\/dashboard`\)/g, "redirect('/dashboard')");

writeFileSync('app/auth/callback/route.ts.modified', content);
