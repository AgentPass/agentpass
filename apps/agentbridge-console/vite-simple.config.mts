/// <reference types='vitest' />
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const replaceExportsPlugin = (): Plugin => {
  // this plugin fixes some corrupted polyfills in the built js that we couldn't fix any other way...
  return {
    name: "replace-exports-plugin",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const [fileName, file] of Object.entries(bundle)) {
        if (file.type === "chunk" && file.code) {
          console.log("\n>> Replacing exports in", fileName);
          file.code = file.code.replace(
            /\((\S+)\.exports\s*=\s*Object\.assign\(\1\.exports\.default\s*,\s*\1\.exports\)\)/g,
            "($1.exports=Object.assign($1.exports.default||{},$1.exports))",
          );
        }
      }
    },
  };
};

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../node_modules/.vite/agentbridge-console",
  server: {
    port: 4200,
    host: "localhost",
  },
  preview: {
    port: 4300,
    host: "localhost",
  },
  plugins: [react(), nodePolyfills(), replaceExportsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    outDir: "../../dist/apps/agentbridge-console",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../coverage/agentbridge-console",
      provider: "v8" as const,
    },
  },
}));
