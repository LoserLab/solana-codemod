import { describe, it, expect } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "../../src/transforms/rewrite-imports";
import { readFileSync } from "fs";
import { join } from "path";

const fixtureDir = join(__dirname, "../fixtures/rewrite-imports");

function applyTransform(source: string): string | undefined {
  return transform(
    { source, path: "test.ts" },
    { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift, stats: () => {}, report: () => {} },
    {},
  ) as string | undefined;
}

describe("rewrite-imports", () => {
  it("transforms fixture correctly", () => {
    const input = readFileSync(join(fixtureDir, "input.ts"), "utf8");
    const expected = readFileSync(join(fixtureDir, "output.ts"), "utf8");
    const result = applyTransform(input);
    expect(result?.trim()).toBe(expected.trim());
  });

  it("removes fully-transformed import declarations", () => {
    const input = `import { PublicKey, Connection } from "@solana/web3.js";\nconsole.log("test");`;
    const result = applyTransform(input);
    expect(result).not.toContain("@solana/web3.js");
  });

  it("keeps non-transformed symbols", () => {
    const input = `import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";\nconsole.log(LAMPORTS_PER_SOL);`;
    const result = applyTransform(input);
    expect(result).toContain("LAMPORTS_PER_SOL");
    expect(result).toContain("@solana/web3.js");
    expect(result).not.toContain("PublicKey");
  });

  it("deduplicates @solana/kit imports", () => {
    const input = `import { address } from "@solana/kit";\nimport { Address } from "@solana/kit";\nconsole.log("test");`;
    const result = applyTransform(input);
    // Should have only one @solana/kit import with both
    const matches = result?.match(/@solana\/kit/g) ?? [];
    expect(matches.length).toBe(1);
    expect(result).toContain("Address");
    expect(result).toContain("address");
  });
});
