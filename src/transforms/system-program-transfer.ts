import type { Transform } from "jscodeshift";
import { addNamedImport, hasImport } from "../utils/imports";
import {
  SYSTEM_PROGRAM_METHODS,
  TRANSFER_PROP_RENAMES,
  CREATE_ACCOUNT_PROP_RENAMES,
  EXTERNAL_IMPORTS,
} from "../utils/constants";

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasImport(j, root, "SystemProgram", "@solana/web3.js")) {
    return undefined;
  }

  let changed = false;

  for (const [v1Method, v2Function] of Object.entries(SYSTEM_PROGRAM_METHODS)) {
    const propRenames =
      v1Method === "transfer"
        ? TRANSFER_PROP_RENAMES
        : CREATE_ACCOUNT_PROP_RENAMES;

    root
      .find(j.CallExpression, {
        callee: {
          type: "MemberExpression",
          object: { type: "Identifier", name: "SystemProgram" },
          property: { type: "Identifier", name: v1Method },
        },
      })
      .forEach((path) => {
        const args = path.node.arguments;
        if (args.length === 0) return;

        const objArg = args[0];
        if (objArg.type !== "ObjectExpression") return;

        // Rename properties
        for (const prop of objArg.properties) {
          if (prop.type !== "Property" && prop.type !== "ObjectProperty") continue;
          const key = (prop as any).key;
          if (!key || key.type !== "Identifier") continue;

          if (key.name in propRenames) {
            key.name = propRenames[key.name];
          }

          // Wrap lamports value: lamports → amount with lamports() wrapper
          if (v1Method === "transfer" && key.name === "lamports") {
            key.name = "amount";
            // Don't double-wrap if already wrapped
            const val = (prop as any).value;
            if (
              val.type !== "CallExpression" ||
              (val.callee as any).name !== "lamports"
            ) {
              (prop as any).value = j.callExpression(j.identifier("lamports"), [
                val,
              ]);
              addNamedImport(j, root, "lamports", "@solana/kit");
            }
          }
        }

        // Replace SystemProgram.method({...}) → v2Function({...})
        j(path).replaceWith(
          j.callExpression(j.identifier(v2Function), [objArg]),
        );

        const importSource = EXTERNAL_IMPORTS[v2Function] ?? "@solana/kit";
        addNamedImport(j, root, v2Function, importSource);
        changed = true;
      });
  }

  return changed ? root.toSource({ quote: "double" }) : undefined;
};

(transform as any).parser = "tsx";
export default transform;
