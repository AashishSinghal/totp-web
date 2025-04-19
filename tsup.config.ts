import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
  external: ['crypto'],
}); 