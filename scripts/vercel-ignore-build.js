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

/**
 * 직전 배포 커밋 이후 바뀐 파일 목록.
 *
 * 범위를 확정할 수 없으면 `null`을 반환하고, 호출부는 그 경우 스킵하지 않고 빌드한다.
 * 잘못 빌드하면 빌드 한 번을 낭비할 뿐이지만, 잘못 스킵하면 수정이 조용히 배포되지 않는다.
 *
 * 예전에는 `VERCEL_GIT_PREVIOUS_SHA`가 없을 때 `HEAD^..HEAD` 한 커밋만 비교했다.
 * 여러 커밋을 한 번에 푸시하면 Vercel이 중간 커밋을 건너뛰고 마지막 커밋만 빌드하는데,
 * 그때 이 비교는 건너뛴 커밋의 변경을 보지 못해 **필요한 빌드를 스킵**한다.
 * 비어 있지 않은 목록이라 호출부는 이를 확정된 결과로 믿는다는 점이 특히 위험했다.
 */
function getChangedFiles() {
  const head = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;

  if (!previous) {
    return null;
  }

  try {
    return runGit(['diff', '--name-only', previous, head]).split(/\r?\n/).filter(Boolean);
  } catch {
    // shallow clone이라 previous 커밋이 로컬에 없을 수 있다.
    return null;
  }
}

if (!appKey || !projects[appKey]) {
  console.error(`Unknown project "${appKey || ''}". Expected one of: ${Object.keys(projects).join(', ')}`);
  process.exit(1);
}

const changed = getChangedFiles();

if (changed === null) {
  console.log(
    `[vercel-ignore] ${appKey}: could not determine the changed range` +
      ' (VERCEL_GIT_PREVIOUS_SHA missing or unreachable), building conservatively.'
  );
  process.exit(1);
}

const changedFiles = changed.map(normalizePath);

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
