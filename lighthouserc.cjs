/* eslint-disable @typescript-eslint/no-require-imports */
const os = require('os');
const path = require('path');

const chromeUserDataDir = path.join(os.tmpdir(), 'lighthouse-chrome-profile');

module.exports = {
  ci: {
    collect: {
      chromePath: '/usr/bin/chromium',
      startServerCommand: 'pnpm run preview',
      startServerReadyPattern: 'Local',
      url: [
        'http://127.0.0.1:4321/terms-of-service/',
        'http://127.0.0.1:4321/privacy-policy/',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: `--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --user-data-dir=${chromeUserDataDir}`,
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],

        // Local dev server artifacts — not applicable to production
        'bf-cache': 'off',
        'document-latency-insight': 'off',
        'errors-in-console': 'off',
        'network-dependency-tree-insight': 'off',
        'uses-text-compression': 'off',
        'unminified-css': 'off',
        'unminified-javascript': 'off',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
