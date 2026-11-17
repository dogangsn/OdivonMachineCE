import { chmodSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const hookDir = resolve(root, '.git', 'hooks');
const preCommitFile = resolve(hookDir, 'pre-commit');

if (existsSync(hookDir)) {
  const content = `#!/bin/sh
if [ "$ODIVON_SKIP_VERSION_BUMP" = "1" ]; then
  exit 0
fi
node scripts/bump-version.mjs
`;
  writeFileSync(preCommitFile, content, { encoding: 'utf8', mode: 0o777 });
  try {
    chmodSync(preCommitFile, 0o777);
  } catch {}
  console.log('✅ Git pre-commit hook kuruldu: her commit atıldığında versiyon otomatik artacak.');
} else {
  console.log('ℹ️ .git/hooks dizini bulunamadı.');
}
