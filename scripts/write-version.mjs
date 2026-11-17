import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
let commit = 'development';
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {}

const builtAt = new Date().toISOString();
const buildId = `${builtAt.replace(/\D/g, '').slice(0, 14)}-${commit}`;
const info = { version: pkg.version, buildId, commit, builtAt };

mkdirSync('src/app/core/version', { recursive: true });
writeFileSync(
  'src/app/core/version/build-info.ts',
  `export const BUILD_INFO = ${JSON.stringify(info)} as const;\n`,
);
writeFileSync(
  'public/version.json',
  JSON.stringify(
    {
      ...info,
      releasedAt: builtAt,
      releaseNotes: [
        '2006/42/EC ve AB 2023/1230 Makine CE uyumluluk merkezi',
        'EN ISO 12100 dinamik risk skoru matrisi ve teknik dosya paketi',
      ],
    },
    null,
    2,
  ),
);

const appCheckSiteKey =
  process.env.ODIVON_APP_CHECK_SITE_KEY ?? process.env.NG_APP_CHECK_SITE_KEY ?? '';
const apiBaseUrl =
  process.env.ODIVON_API_BASE_URL ??
  process.env.NG_API_BASE_URL ??
  'https://mainapi.odivon.com/api/v1';

writeFileSync(
  'public/runtime-config.js',
  `window.__ODIVON_CONFIG__ = Object.assign({ apiBaseUrl: ${JSON.stringify(apiBaseUrl)}, appCheckSiteKey: ${JSON.stringify(appCheckSiteKey)} }, window.__ODIVON_CONFIG__ || {});\n`,
);
