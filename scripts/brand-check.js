// Check the built pages against the FSOtools identity.
//
//   npm run brand-check
//
// This repository does not hold the identity's rules. They belong to the
// FSOtools website (fsotools-website: BRAND.md, scripts/brand-check.mjs), and
// this script runs that repository's checker over dist/ so the two can never
// disagree. `npm run site-bundle` calls it and refuses to bundle pages that
// fail; the website's `npm run import-reporting` runs the same check again.
//
// The website checkout is looked for beside this one (../fsotools-website);
// set FSOTOOLS_WEBSITE to use another checkout (a worktree, for instance).
// Exit 0 = on the identity, 1 = off it, 2 = could not check.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The website's checker module, or null when no website checkout is found. */
export function websiteChecker() {
  const site = resolve(process.env.FSOTOOLS_WEBSITE || join(ROOT, '..', 'fsotools-website'));
  const file = join(site, 'scripts', 'brand-check.mjs');
  return existsSync(file) ? { site, file } : null;
}

/** Build dist/ and check it. Returns { status: 'passed' | 'failed' | 'unavailable', files, failed, site }. */
export async function brandCheck({ build = true } = {}) {
  const checker = websiteChecker();
  if (!checker) return { status: 'unavailable' };
  if (build) execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.js')], { cwd: ROOT, stdio: 'pipe' });
  const { checkBrandPaths } = await import(pathToFileURL(checker.file).href);
  const { files, failed } = checkBrandPaths([join(ROOT, 'dist')]);
  return { status: Object.keys(failed).length ? 'failed' : 'passed', files, failed, site: checker.site };
}

/** Print a result the way the command line and site-bundle report it. Returns the exit code. */
export function report(result) {
  if (result.status === 'unavailable') {
    console.error('Brand check could not run: no fsotools-website checkout with scripts/brand-check.mjs was found beside this repository.');
    console.error('The identity is owned there (BRAND.md). Check it out as ../fsotools-website, or set FSOTOOLS_WEBSITE to its path.');
    return 2;
  }
  for (const [file, problems] of Object.entries(result.failed)) {
    console.error(`OFF BRAND ${file}`);
    for (const p of problems) console.error(`  ${p}`);
  }
  if (result.status === 'failed') {
    console.error(`${Object.keys(result.failed).length} of ${result.files.length} pages are off the FSOtools identity (${join(result.site, 'BRAND.md')}).`);
    return 1;
  }
  console.log(`Brand check passed: ${result.files.length} pages on the FSOtools identity (rules from ${result.site}).`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(report(await brandCheck()));
}
