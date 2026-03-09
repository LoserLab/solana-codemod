import type { Transform } from "jscodeshift";
import { addNamedImport, hasImport } from "../utils/imports";

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasImport(j, root, "Transaction", "@solana/web3.js")) {
    return undefined;
  }

  let changed = false;

  // Find all variables assigned from new Transaction()
  const txVarDeclarators = root.find(j.VariableDeclarator, {
    init: {
      type: "NewExpression",
      callee: { type: "Identifier", name: "Transaction" },
    },
  });

  txVarDeclarators.forEach((declaratorPath) => {
    const id = declaratorPath.node.id;
    if (id.type !== "Identifier") return;
    const varName = id.name;

    // Collect .add() instructions
    const instructions: any[] = [];
    root
      .find(j.ExpressionStatement, {
        expression: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: varName },
            property: { type: "Identifier", name: "add" },
          },
        },
      })
      .forEach((stmtPath) => {
        const callExpr = stmtPath.node.expression as any;
        if (callExpr.arguments.length > 0) {
          instructions.push(callExpr.arguments[0]);
        }
        j(stmtPath).remove();
      });

    // Collect .feePayer assignment
    let feePayer: any = null;
    root
      .find(j.ExpressionStatement, {
        expression: {
          type: "AssignmentExpression",
          left: {
            type: "MemberExpression",
            object: { type: "Identifier", name: varName },
            property: { type: "Identifier", name: "feePayer" },
          },
        },
      })
      .forEach((stmtPath) => {
        feePayer = (stmtPath.node.expression as any).right;
        j(stmtPath).remove();
      });

    // Collect .recentBlockhash assignment
    let recentBlockhash: any = null;
    root
      .find(j.ExpressionStatement, {
        expression: {
          type: "AssignmentExpression",
          left: {
            type: "MemberExpression",
            object: { type: "Identifier", name: varName },
            property: { type: "Identifier", name: "recentBlockhash" },
          },
        },
      })
      .forEach((stmtPath) => {
        recentBlockhash = (stmtPath.node.expression as any).right;
        j(stmtPath).remove();
      });

    // Also check for constructor options: new Transaction({ feePayer, recentBlockhash })
    const initExpr = declaratorPath.node.init as any;
    if (initExpr?.arguments?.[0]?.type === "ObjectExpression") {
      const opts = initExpr.arguments[0];
      for (const prop of opts.properties) {
        if (prop.type !== "Property") continue;
        const key = (prop as any).key;
        if (key?.name === "feePayer" && !feePayer) {
          feePayer = (prop as any).value;
        }
        if (key?.name === "recentBlockhash" && !recentBlockhash) {
          recentBlockhash = (prop as any).value;
        }
      }
    }

    // Build pipe() stages
    const pipeArgs: any[] = [];

    // Stage 1: createTransactionMessage({ version: 0 })
    pipeArgs.push(
      j.callExpression(j.identifier("createTransactionMessage"), [
        j.objectExpression([
          j.property("init", j.identifier("version"), j.literal(0)),
        ]),
      ]),
    );

    // Stage 2: setTransactionMessageFeePayer (if feePayer was set)
    if (feePayer) {
      pipeArgs.push(
        j.arrowFunctionExpression(
          [j.identifier("msg")],
          j.callExpression(j.identifier("setTransactionMessageFeePayer"), [
            feePayer,
            j.identifier("msg"),
          ]),
        ),
      );
      addNamedImport(j, root, "setTransactionMessageFeePayer", "@solana/kit");
    }

    // Stage 3: setTransactionMessageLifetimeUsingBlockhash (if recentBlockhash was set)
    if (recentBlockhash) {
      pipeArgs.push(
        j.arrowFunctionExpression(
          [j.identifier("msg")],
          j.callExpression(
            j.identifier("setTransactionMessageLifetimeUsingBlockhash"),
            [recentBlockhash, j.identifier("msg")],
          ),
        ),
      );
      addNamedImport(
        j,
        root,
        "setTransactionMessageLifetimeUsingBlockhash",
        "@solana/kit",
      );
    }

    // Stage 4: appendTransactionMessageInstructions (if any .add() calls)
    if (instructions.length > 0) {
      const fn =
        instructions.length === 1
          ? "appendTransactionMessageInstruction"
          : "appendTransactionMessageInstructions";
      const arg =
        instructions.length === 1
          ? instructions[0]
          : j.arrayExpression(instructions);

      pipeArgs.push(
        j.arrowFunctionExpression(
          [j.identifier("msg")],
          j.callExpression(j.identifier(fn), [arg, j.identifier("msg")]),
        ),
      );
      addNamedImport(j, root, fn, "@solana/kit");
    }

    // Replace the initializer with pipe(...)
    declaratorPath.node.init = j.callExpression(j.identifier("pipe"), pipeArgs);

    addNamedImport(j, root, "pipe", "@solana/kit");
    addNamedImport(j, root, "createTransactionMessage", "@solana/kit");
    changed = true;
  });

  // Handle chained: new Transaction().add(ix1).add(ix2)
  // This is a call expression, not a variable declarator pattern
  root
    .find(j.CallExpression)
    .filter((path) => {
      // Look for chains that start with new Transaction()
      let node = path.node;
      while (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        (node.callee.property as any).name === "add"
      ) {
        node = node.callee.object as any;
      }
      return (
        (node as any).type === "NewExpression" &&
        (node as any).callee?.name === "Transaction"
      );
    })
    .forEach((path) => {
      // Only process the outermost .add() call in a chain
      const parent = path.parentPath?.node;
      if (
        parent?.type === "MemberExpression" &&
        (parent.property as any)?.name === "add"
      ) {
        return; // Inner call, skip
      }

      // Unwind the chain to collect instructions
      const instructions: any[] = [];
      let node: any = path.node;
      while (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.property.name === "add"
      ) {
        if (node.arguments.length > 0) {
          instructions.unshift(node.arguments[0]);
        }
        node = node.callee.object;
      }

      const pipeArgs: any[] = [
        j.callExpression(j.identifier("createTransactionMessage"), [
          j.objectExpression([
            j.property("init", j.identifier("version"), j.literal(0)),
          ]),
        ]),
      ];

      if (instructions.length > 0) {
        const fn =
          instructions.length === 1
            ? "appendTransactionMessageInstruction"
            : "appendTransactionMessageInstructions";
        const arg =
          instructions.length === 1
            ? instructions[0]
            : j.arrayExpression(instructions);

        pipeArgs.push(
          j.arrowFunctionExpression(
            [j.identifier("msg")],
            j.callExpression(j.identifier(fn), [arg, j.identifier("msg")]),
          ),
        );
        addNamedImport(j, root, fn, "@solana/kit");
      }

      j(path).replaceWith(j.callExpression(j.identifier("pipe"), pipeArgs));
      addNamedImport(j, root, "pipe", "@solana/kit");
      addNamedImport(j, root, "createTransactionMessage", "@solana/kit");
      changed = true;
    });

  return changed ? root.toSource({ quote: "double" }) : undefined;
};

(transform as any).parser = "tsx";
export default transform;
