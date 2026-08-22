import { defineConfig, devices } from '@playwright/test';

// frontendはビルド不要の静的ファイル（README.md記載の `python3 -m http.server 5500` を想定）。
// backend（8080）・DBは事前に手動起動しておく必要があるため webServer は使わない（perf-testと同じ運用）。
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5500',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
