import type { Transform } from "jscodeshift";
import { addNamedImport, hasImport } from "../utils/imports";

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasImport(j, root, "PublicKey", "@solana/web3.js")) {
    return undefined;
  }

  let changed = false;

  // new PublicKey(arg) → address(arg)
  root
    .find(j.NewExpression, { callee: { type: "Identifier", name: "PublicKey" } })
    .forEach((path) => {
      const args = path.node.arguments;

      // PublicKey(Buffer/Uint8Array) can't be auto-converted; leave a TODO
      // We transform string arguments and variables (best-effort)
      j(path).replaceWith(j.callExpression(j.identifier("address"), args as any));
      changed = true;
    });

  // PublicKey.findProgramAddress([seeds], programId)
  // → getProgramDerivedAddress({ programAddress: programId, seeds: [seeds] })
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "PublicKey" },
        property: { type: "Identifier", name: "findProgramAddress" },
      },
    })
    .forEach((path) => {
      const args = path.node.arguments;
      const seedsArg = args[0];
      const programIdArg = args[1];

      if (seedsArg && programIdArg) {
        j(path).replaceWith(
          j.callExpression(j.identifier("getProgramDerivedAddress"), [
            j.objectExpression([
              j.property("init", j.identifier("programAddress"), programIdArg as any),
              j.property("init", j.identifier("seeds"), seedsArg as any),
            ]),
          ]),
        );
        addNamedImport(j, root, "getProgramDerivedAddress", "@solana/kit");
        changed = true;
      }
    });

  // .toBase58() → remove the call (addresses are already strings in v2)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        property: { type: "Identifier", name: "toBase58" },
      },
    })
    .forEach((path) => {
      const callee = path.node.callee as any;
      j(path).replaceWith(callee.object);
      changed = true;
    });

  // .toString() on PublicKey → remove (same reason)
  // This is trickier since .toString() is generic; only do it when we're confident
  // Skip for MVP, could cause false positives

  // PublicKey type annotation → Address type
  root
    .find(j.TSTypeReference, {
      typeName: { type: "Identifier", name: "PublicKey" },
    })
    .forEach((path) => {
      j(path).replaceWith(
        j.tsTypeReference(j.identifier("Address")),
      );
      changed = true;
    });

  if (changed) {
    addNamedImport(j, root, "address", "@solana/kit");
    addNamedImport(j, root, "Address", "@solana/kit");
  }

  return changed ? root.toSource({ quote: "double" }) : undefined;
};

(transform as any).parser = "tsx";
export default transform;
