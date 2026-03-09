import type { Transform, ASTPath } from "jscodeshift";
import { addNamedImport, hasImport } from "../utils/imports";

function makeEnclosingFunctionAsync(j: any, path: ASTPath): void {
  let current = path.parentPath;
  while (current) {
    const node = current.node;
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      node.async = true;
      return;
    }
    current = current.parentPath;
  }
}

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasImport(j, root, "Keypair", "@solana/web3.js")) {
    return undefined;
  }

  let changed = false;

  // Track variable names assigned from Keypair methods
  const keypairVars = new Set<string>();

  // Keypair.generate() → await generateKeyPairSigner()
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "Keypair" },
        property: { type: "Identifier", name: "generate" },
      },
    })
    .forEach((path) => {
      // Track variable name
      const parent = path.parentPath;
      if (
        parent.node.type === "VariableDeclarator" &&
        parent.node.id.type === "Identifier"
      ) {
        keypairVars.add(parent.node.id.name);
      }

      const replacement = j.awaitExpression(
        j.callExpression(j.identifier("generateKeyPairSigner"), []),
      );
      j(path).replaceWith(replacement);
      makeEnclosingFunctionAsync(j, path);
      addNamedImport(j, root, "generateKeyPairSigner", "@solana/kit");
      changed = true;
    });

  // Keypair.fromSecretKey(bytes) → await createKeyPairSignerFromBytes(bytes)
  root
    .find(j.CallExpression, {
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "Keypair" },
        property: { type: "Identifier", name: "fromSecretKey" },
      },
    })
    .forEach((path) => {
      const args = path.node.arguments;

      const parent = path.parentPath;
      if (
        parent.node.type === "VariableDeclarator" &&
        parent.node.id.type === "Identifier"
      ) {
        keypairVars.add(parent.node.id.name);
      }

      const replacement = j.awaitExpression(
        j.callExpression(j.identifier("createKeyPairSignerFromBytes"), args as any),
      );
      j(path).replaceWith(replacement);
      makeEnclosingFunctionAsync(j, path);
      addNamedImport(j, root, "createKeyPairSignerFromBytes", "@solana/kit");
      changed = true;
    });

  // keypair.publicKey → keypair.address
  root
    .find(j.MemberExpression, {
      property: { type: "Identifier", name: "publicKey" },
    })
    .forEach((path) => {
      const obj = path.node.object;
      if (obj.type === "Identifier" && keypairVars.has(obj.name)) {
        path.node.property = j.identifier("address");
        changed = true;
      }
    });

  // Keypair type annotation → KeyPairSigner
  root
    .find(j.TSTypeReference, {
      typeName: { type: "Identifier", name: "Keypair" },
    })
    .forEach((path) => {
      j(path).replaceWith(j.tsTypeReference(j.identifier("KeyPairSigner")));
      addNamedImport(j, root, "KeyPairSigner", "@solana/kit");
      changed = true;
    });

  return changed ? root.toSource({ quote: "double" }) : undefined;
};

(transform as any).parser = "tsx";
export default transform;
