#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

const appKey = process.argv[2];

const projects = {
  admin: ['apps/admin/', 'packages/shared/', 'packages/ui/'],
  'table-order': ['apps/table-order/', 'packages/order-core/', 'packages/shared/'],
  'delivery-customer': ['apps/delivery-customer/', 'packages/order-core/', 'packages/shared/', 'packages/ui/'],
  backend: ['apps/backend/', 'packages/shared/'],
  'brand-website': ['apps/brand-website/', 'packages/shared/', 'packages/ui/'],
};

const globalBuildFiles = new Set([
  '.npmrc',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'scripts/vercel-ignore-build.js',
  'turbo.json',
]);

function runGit(args) {
  return execFileSync('git', ['-c', 'safe.directory=*', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function normalizePath(file) {
  return file.replace(/\\/g, '/');
}

function getChangedFiles() {
  const head = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;

  if (previous) {
    try {
      return runGit(['diff', '--name-only', previous, head]).split(/\r?\n/).filter(Boolean);
    } catch {
      // Fall through to the shallow-clone friendly comparison below.
    }
  }

  try {
    const committedChanges = runGit(['diff', '--name-only', 'HEAD^', 'HEAD']).split(/\r?\n/).filter(Boolean);
    if (committedChanges.length > 0) {
      return committedChanges;
    }

    return runGit(['diff', '--name-only', 'HEAD']).split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

if (!appKey || !projects[appKey]) {
  console.error(`Unknown project "${appKey || ''}". Expected one of: ${Object.keys(projects).join(', ')}`);
  process.exit(1);
}

const changedFiles = getChangedFiles().map(normalizePath);

if (changedFiles.length === 0) {
  console.log(`[vercel-ignore] ${appKey}: no changed files detected, building conservatively.`);
  process.exit(1);
}

const relevantPrefixes = projects[appKey];
const shouldBuild = changedFiles.some((file) => {
  if (globalBuildFiles.has(file)) {
    return true;
  }

  return relevantPrefixes.some((prefix) => file.startsWith(prefix));
});

if (shouldBuild) {
  console.log(`[vercel-ignore] ${appKey}: relevant changes detected, build required.`);
  changedFiles.forEach((file) => console.log(` - ${file}`));
  process.exit(1);
}

console.log(`[vercel-ignore] ${appKey}: no relevant changes, skipping build.`);
changedFiles.forEach((file) => console.log(` - ${file}`));
process.exit(0);
