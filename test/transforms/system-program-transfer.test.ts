import { describe, it, expect } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "../../src/transforms/system-program-transfer";
import { readFileSync } from "fs";
import { join } from "path";

const fixtureDir = join(__dirname, "../fixtures/system-program-transfer");

function applyTransform(source: string): string | undefined {
  return transform(
    { source, path: "test.ts" },
    { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift, stats: () => {}, report: () => {} },
    {},
  ) as string | undefined;
}

describe("system-program-transfer", () => {
  it("transforms fixture correctly", () => {
    const input = readFileSync(join(fixtureDir, "input.ts"), "utf8");
    const expected = readFileSync(join(fixtureDir, "output.ts"), "utf8");
    const result = applyTransform(input);
    expect(result?.trim()).toBe(expected.trim());
  });

  it("returns undefined when no SystemProgram import", () => {
    const result = applyTransform(`const x = 1;`);
    expect(result).toBeUndefined();
  });

  it("renames transfer properties", () => {
    const input = `import { SystemProgram } from "@solana/web3.js";\nconst ix = SystemProgram.transfer({ fromPubkey: a, toPubkey: b, lamports: 100 });`;
    const result = applyTransform(input);
    expect(result).toContain("source: a");
    expect(result).toContain("destination: b");
    expect(result).toContain("amount: lamports(100)");
    expect(result).toContain("getTransferSolInstruction");
  });

  it("renames createAccount properties", () => {
    const input = `import { SystemProgram } from "@solana/web3.js";\nconst ix = SystemProgram.createAccount({ fromPubkey: a, newAccountPubkey: b, lamports: 100, space: 10, programId: pid });`;
    const result = applyTransform(input);
    expect(result).toContain("payer: a");
    expect(result).toContain("newAccount: b");
    expect(result).toContain("programAddress: pid");
    expect(result).toContain("getCreateAccountInstruction");
  });
});
