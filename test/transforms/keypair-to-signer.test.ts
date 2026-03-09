import { describe, it, expect } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "../../src/transforms/keypair-to-signer";
import { readFileSync } from "fs";
import { join } from "path";

const fixtureDir = join(__dirname, "../fixtures/keypair-to-signer");

function applyTransform(source: string): string | undefined {
  return transform(
    { source, path: "test.ts" },
    { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift, stats: () => {}, report: () => {} },
    {},
  ) as string | undefined;
}

describe("keypair-to-signer", () => {
  it("transforms fixture correctly", () => {
    const input = readFileSync(join(fixtureDir, "input.ts"), "utf8");
    const expected = readFileSync(join(fixtureDir, "output.ts"), "utf8");
    const result = applyTransform(input);
    expect(result?.trim()).toBe(expected.trim());
  });

  it("returns undefined when no Keypair import", () => {
    const result = applyTransform(`const x = 1;`);
    expect(result).toBeUndefined();
  });

  it("adds await and async to Keypair.generate()", () => {
    const input = `import { Keypair } from "@solana/web3.js";\nfunction f() { const kp = Keypair.generate(); }`;
    const result = applyTransform(input);
    expect(result).toContain("async function f()");
    expect(result).toContain("await generateKeyPairSigner()");
  });

  it("transforms Keypair type to KeyPairSigner", () => {
    const input = `import { Keypair } from "@solana/web3.js";\nfunction f(kp: Keypair) {}`;
    const result = applyTransform(input);
    expect(result).toContain("KeyPairSigner");
  });

  it("transforms .publicKey to .address", () => {
    const input = `import { Keypair } from "@solana/web3.js";\nfunction f() { const kp = Keypair.generate(); const pk = kp.publicKey; }`;
    const result = applyTransform(input);
    expect(result).toContain("kp.address");
  });
});
