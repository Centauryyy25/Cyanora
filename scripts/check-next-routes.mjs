#!/usr/bin/env node
// Simple prebuild check for Next 15 route signatures and Suspense usage hints
// - Dynamic API routes must use (req: NextRequest, context: { params: Promise<{...}> })
// This is a best-effort regex scan to fail early with actionable errors.

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiDir = path.join(root, 'src', 'app', 'api');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && e.name === 'route.ts') out.push(p);
  }
  return out;
}

function isDynamicRoute(filePath) {
  // Any segment like [id] or [...slug]
  return /\[(?:\.\.\.)?[^\]]+\]/.test(filePath);
}

function isCatchAll(filePath) {
  // Skip aggressive checks for catch-all like [...nextauth]
  return /\[(?:\.\.\.)[^\]]+\]/.test(filePath);
}

const files = fs.existsSync(apiDir) ? walk(apiDir) : [];
const errors = [];

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const dynamic = isDynamicRoute(f);
  if (!dynamic) continue;

  const catchAll = isCatchAll(f);
  // Only require NextRequest usage; don't enforce import location strictly
  const referencesNextRequest = /\bNextRequest\b/.test(src);
  if (!referencesNextRequest) {
    errors.push(`[${f}] handler should type first arg as NextRequest`);
  }

  // Check each exported handler signature
  const handlerRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(([^)]*)\)/g;
  let m;
  while ((m = handlerRegex.exec(src))) {
    const name = m[1];
    const args = m[2];
    // First arg should be NextRequest
    if (!/\bNextRequest\b/.test(args)) {
      errors.push(`[${f}] ${name}(): first arg should be typed as NextRequest`);
    }
    // For non-catch-all dynamic routes, if a second arg named context is present, ensure Promise params
    if (!catchAll && /\bcontext\s*:/.test(args)) {
      if (!/context\s*:\s*\{\s*params:\s*Promise<\{[\s\S]*?\}>\s*\}/.test(args)) {
        errors.push(`[${f}] ${name}(): second arg should be context: { params: Promise<{ ... }> }`);
      }
    }
  }
}

if (errors.length) {
  console.error('\n[check-next-routes] Found issues:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('[check-next-routes] OK');
