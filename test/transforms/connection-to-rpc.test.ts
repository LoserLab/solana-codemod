import { describe, it, expect } from "vitest";
import jscodeshift from "jscodeshift";
import transform from "../../src/transforms/connection-to-rpc";
import { readFileSync } from "fs";
import { join } from "path";

const fixtureDir = join(__dirname, "../fixtures/connection-to-rpc");

function applyTransform(source: string): string | undefined {
  return transform(
    { source, path: "test.ts" },
    { jscodeshift: jscodeshift.withParser("tsx"), j: jscodeshift, stats: () => {}, report: () => {} },
    {},
  ) as string | undefined;
}

describe("connection-to-rpc", () => {
  it("transforms fixture correctly", () => {
    const input = readFileSync(join(fixtureDir, "input.ts"), "utf8");
    const expected = readFileSync(join(fixtureDir, "output.ts"), "utf8");
    const result = applyTransform(input);
    expect(result?.trim()).toBe(expected.trim());
  });

  it("returns undefined when no Connection import", () => {
    const result = applyTransform(`const x = 1;`);
    expect(result).toBeUndefined();
  });

  it("replaces new Connection with createSolanaRpc", () => {
    const input = `import { Connection } from "@solana/web3.js";\nconst c = new Connection("https://api.mainnet-beta.solana.com");`;
    const result = applyTransform(input);
    expect(result).toContain("createSolanaRpc");
    expect(result).not.toContain("new Connection");
  });

  it("appends .send() to method calls", () => {
    const input = `import { Connection } from "@solana/web3.js";\nconst c = new Connection(url);\nawait c.getBalance(pk);`;
    const result = applyTransform(input);
    expect(result).toContain(".getBalance(pk).send()");
  });
});
