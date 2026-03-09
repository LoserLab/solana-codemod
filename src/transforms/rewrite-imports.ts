import type { Transform } from "jscodeshift";
import { V1_TRANSFORMED_SYMBOLS } from "../utils/constants";

const transform: Transform = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  let changed = false;

  // Remove transformed symbols from @solana/web3.js imports
  root
    .find(j.ImportDeclaration, { source: { value: "@solana/web3.js" } })
    .forEach((path) => {
      const specifiers = path.node.specifiers ?? [];
      const remaining = specifiers.filter((s: any) => {
        if (s.type !== "ImportSpecifier" || !s.imported) return true;
        return !V1_TRANSFORMED_SYMBOLS.includes(s.imported.name as any);
      });

      if (remaining.length !== specifiers.length) {
        changed = true;
      }

      if (remaining.length === 0) {
        j(path).remove();
      } else {
        path.node.specifiers = remaining;
      }
    });

  // Deduplicate imports from the same source
  const importMap = new Map<string, Set<string>>();
  const importPaths: any[] = [];

  root.find(j.ImportDeclaration).forEach((path) => {
    const source = (path.node.source as any).value as string;
    if (!source.startsWith("@solana/")) return;

    const specifiers = path.node.specifiers ?? [];
    const names = specifiers
      .filter((s: any) => s.type === "ImportSpecifier" && s.imported)
      .map((s: any) => s.imported.name as string);

    if (!importMap.has(source)) {
      importMap.set(source, new Set());
    }
    const existing = importMap.get(source)!;
    for (const name of names) {
      existing.add(name);
    }
    importPaths.push(path);
  });

  // Check for duplicates
  const seen = new Map<string, boolean>();
  for (const path of importPaths) {
    const source = (path.node.source as any).value as string;
    if (!source.startsWith("@solana/")) continue;

    if (seen.has(source)) {
      // Duplicate, merge into the first one and remove this
      j(path).remove();
      changed = true;
    } else {
      seen.set(source, true);
      // Rebuild specifiers from the deduped set
      const allNames = importMap.get(source);
      if (allNames) {
        const dedupedSpecifiers = [...allNames].sort().map((name) =>
          j.importSpecifier(j.identifier(name)),
        );
        path.node.specifiers = dedupedSpecifiers;
      }
    }
  }

  return changed ? root.toSource({ quote: "double" }) : undefined;
};

(transform as any).parser = "tsx";
export default transform;
