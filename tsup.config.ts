import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "bin/solana-codemod": "bin/solana-codemod.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  shims: true,
});
