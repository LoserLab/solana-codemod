import { describe, it, expect } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "../../src/transforms/transaction-to-pipe";
import { readFileSync } from "fs";
import { join } from "path";

const fixtureDir = join(__dirname, "../fixtures/transaction-to-pipe");

function applyTransform(source: string): string | undefined {
  return transform(
    { source, path: "test.ts" },
    { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift, stats: () => {}, report: () => {} },
    {},
  ) as string | undefined;
}

describe("transaction-to-pipe", () => {
  it("transforms fixture correctly", () => {
    const input = readFileSync(join(fixtureDir, "input.ts"), "utf8");
    const expected = readFileSync(join(fixtureDir, "output.ts"), "utf8");
    const result = applyTransform(input);
    expect(result?.trim()).toBe(expected.trim());
  });

  it("returns undefined when no Transaction import", () => {
    const result = applyTransform(`const x = 1;`);
    expect(result).toBeUndefined();
  });

  it("converts new Transaction + .add() to pipe", () => {
    const input = `import { Transaction } from "@solana/web3.js";\nconst tx = new Transaction();\ntx.add(ix1);`;
    const result = applyTransform(input);
    expect(result).toContain("pipe(");
    expect(result).toContain("createTransactionMessage");
    expect(result).toContain("appendTransactionMessageInstruction");
    expect(result).not.toContain("new Transaction");
    expect(result).not.toContain("tx.add");
  });

  it("handles feePayer and recentBlockhash", () => {
    const input = `import { Transaction } from "@solana/web3.js";\nconst tx = new Transaction();\ntx.feePayer = payer;\ntx.recentBlockhash = hash;`;
    const result = applyTransform(input);
    expect(result).toContain("setTransactionMessageFeePayer");
    expect(result).toContain("setTransactionMessageLifetimeUsingBlockhash");
  });
});
