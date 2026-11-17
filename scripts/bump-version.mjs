import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const pkgUrl = new URL('package.json', root);
const pkg = JSON.parse(readFileSync(pkgUrl, 'utf8'));

const semver = String(pkg.version || '1.0.0')
  .split('.')
  .map(Number);

if (semver.length === 3 && !semver.some(Number.isNaN)) {
  const oldVersion = pkg.version;
  semver[2] += 1;
  const newVersion = semver.join('.');
  pkg.version = newVersion;
  writeFileSync(pkgUrl, JSON.stringify(pkg, null, 2) + '\n');
  console.log(
    `\n🚀 [Auto-Version Hook] Sürüm otomatik güncellendi: v${oldVersion} ➔ v${newVersion}`,
  );

  try {
    const lockUrl = new URL('package-lock.json', root);
    const lock = JSON.parse(readFileSync(lockUrl, 'utf8'));
    lock.version = newVersion;
    if (lock.packages && lock.packages['']) {
      lock.packages[''].version = newVersion;
    }
    writeFileSync(lockUrl, JSON.stringify(lock, null, 2) + '\n');
  } catch {}

  try {
    execSync('node scripts/write-version.mjs', { cwd: root, stdio: 'inherit' });
  } catch (err) {
    console.error('write-version hatası:', err);
  }

  try {
    execSync(
      'git add package.json package-lock.json src/app/core/version/build-info.ts public/version.json',
      { cwd: root },
    );
  } catch {}
}
