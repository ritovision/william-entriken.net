/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/components/layout/navigation/scripts/ai-assist/**/*.ts',
        'src/components/shared/feeds/**/*.{ts,mjs}',
        'src/components/shared/forms/**/*.ts',
      ],
    },
  },
});
