import { describe, it, expect } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "../../src/transforms/public-key-to-address";
import { readFileSync } from "fs";
import { join } from "path";

const fixtureDir = join(__dirname, "../fixtures/public-key-to-address");

function applyTransform(source: string): string | undefined {
  return transform(
    { source, path: "test.ts" },
    { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift, stats: () => {}, report: () => {} },
    {},
  ) as string | undefined;
}

describe("public-key-to-address", () => {
  it("transforms fixture correctly", () => {
    const input = readFileSync(join(fixtureDir, "input.ts"), "utf8");
    const expected = readFileSync(join(fixtureDir, "output.ts"), "utf8");
    const result = applyTransform(input);
    expect(result?.trim()).toBe(expected.trim());
  });

  it("returns undefined when no PublicKey import", () => {
    const result = applyTransform(`const x = 1;`);
    expect(result).toBeUndefined();
  });

  it("transforms new PublicKey(string)", () => {
    const input = `import { PublicKey } from "@solana/web3.js";\nconst pk = new PublicKey("abc");`;
    const result = applyTransform(input);
    expect(result).toContain('address("abc")');
  });

  it("transforms PublicKey type annotations", () => {
    const input = `import { PublicKey } from "@solana/web3.js";\nfunction f(k: PublicKey): PublicKey { return k; }`;
    const result = applyTransform(input);
    expect(result).toContain("Address");
    expect(result).not.toContain(": PublicKey");
  });

  it("removes .toBase58() calls", () => {
    const input = `import { PublicKey } from "@solana/web3.js";\nconst s = pk.toBase58();`;
    const result = applyTransform(input);
    expect(result).toContain("const s = pk;");
  });
});
