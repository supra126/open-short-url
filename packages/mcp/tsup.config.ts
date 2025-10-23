import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/utils/api-client.ts',
    'src/types/api.ts',
    'src/tools/url-tools.ts',
    'src/tools/bundle-tools.ts',
    'src/tools/analytics-tools.ts',
    'src/tools/variant-tools.ts',
  ],
  format: ['esm'],
  clean: true,
  sourcemap: true,
  minify: false, // Don't minify for better debugging
  bundle: false, // Don't bundle to allow importing individual modules
  dts: true, // Generate TypeScript declaration files
  shims: true,
  splitting: false,
  // Ensure generated file is executable
  onSuccess: 'chmod +x dist/index.js',
});
