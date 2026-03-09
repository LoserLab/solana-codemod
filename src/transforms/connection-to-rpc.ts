import type { Transform } from "jscodeshift";
import { addNamedImport, hasImport } from "../utils/imports";

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasImport(j, root, "Connection", "@solana/web3.js")) {
    return undefined;
  }

  let changed = false;

  // Track variable names assigned from new Connection(...)
  const connectionVars = new Set<string>();

  // new Connection(url) → createSolanaRpc(url)
  // new Connection(url, commitment) → createSolanaRpc(url) (commitment moves to calls)
  // new Connection(url, { wsEndpoint }) → createSolanaRpc(url) + createSolanaRpcSubscriptions(wsEndpoint)
  root
    .find(j.NewExpression, { callee: { type: "Identifier", name: "Connection" } })
    .forEach((path) => {
      const args = path.node.arguments;
      const urlArg = args[0];

      if (!urlArg) return;

      // Check if there's a wsEndpoint in options
      const optionsArg = args[1];
      let wsEndpoint: any = null;

      if (
        optionsArg &&
        optionsArg.type === "ObjectExpression"
      ) {
        const wsProp = optionsArg.properties.find(
          (p: any) =>
            p.type === "Property" &&
            p.key &&
            (p.key.name === "wsEndpoint" || p.key.value === "wsEndpoint"),
        ) as any;
        if (wsProp) {
          wsEndpoint = wsProp.value;
        }
      }

      // Track the variable name
      const parent = path.parentPath;
      if (
        parent.node.type === "VariableDeclarator" &&
        parent.node.id.type === "Identifier"
      ) {
        connectionVars.add(parent.node.id.name);
      }

      // Replace new Connection(url, ...) → createSolanaRpc(url)
      j(path).replaceWith(
        j.callExpression(j.identifier("createSolanaRpc"), [urlArg] as any),
      );
      addNamedImport(j, root, "createSolanaRpc", "@solana/kit");
      changed = true;

      // If wsEndpoint was found, insert createSolanaRpcSubscriptions after this statement
      if (wsEndpoint) {
        const stmt = j(path).closest(j.VariableDeclaration);
        if (stmt.length > 0) {
          const subscriptionDecl = j.variableDeclaration("const", [
            j.variableDeclarator(
              j.identifier("rpcSubscriptions"),
              j.callExpression(j.identifier("createSolanaRpcSubscriptions"), [
                wsEndpoint,
              ]),
            ),
          ]);
          stmt.at(0).insertAfter(subscriptionDecl);
          addNamedImport(j, root, "createSolanaRpcSubscriptions", "@solana/kit");
        }
      }
    });

  // Rename Connection type annotation → (leave as TODO since there's no direct equivalent type name)
  // In v2, the type is Rpc<SolanaRpcApi> which is too complex for auto-transform

  // Append .send() to method calls on connection variables
  // e.g., connection.getBalance(pk) → rpc.getBalance(pk).send()
  if (connectionVars.size > 0) {
    root.find(j.CallExpression).forEach((path) => {
      const callee = path.node.callee;
      if (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        connectionVars.has(callee.object.name)
      ) {
        // Skip if already wrapped in .send()
        const parentCallee = path.parentPath?.node;
        if (
          parentCallee &&
          parentCallee.type === "MemberExpression" &&
          parentCallee.property &&
          (parentCallee.property as any).name === "send"
        ) {
          return;
        }

        // Wrap: connection.method(args) → connection.method(args).send()
        j(path).replaceWith(
          j.callExpression(
            j.memberExpression(path.node, j.identifier("send")),
            [],
          ),
        );
        changed = true;
      }
    });
  }

  return changed ? root.toSource({ quote: "double" }) : undefined;
};

(transform as any).parser = "tsx";
export default transform;
