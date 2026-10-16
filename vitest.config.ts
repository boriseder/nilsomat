import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      sharp: path.resolve(__dirname, 'server/node_modules/sharp')
    }
  },
  test: {
    include: ['test/**/*.test.ts', 'server/test/**/*.test.ts', 'client/test/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**']
  }
});
