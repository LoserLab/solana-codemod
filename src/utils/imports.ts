import type { JSCodeshift, Collection } from "jscodeshift";

/**
 * Add a named import to the file. If an import from the same source exists,
 * the specifier is appended. Otherwise a new import declaration is created.
 */
export function addNamedImport(
  j: JSCodeshift,
  root: Collection,
  name: string,
  source: string,
): void {
  const existing = root.find(j.ImportDeclaration, {
    source: { value: source },
  });

  if (existing.length > 0) {
    const decl = existing.at(0).get();
    const specifiers = decl.node.specifiers ?? [];
    const alreadyImported = specifiers.some(
      (s: any) =>
        s.type === "ImportSpecifier" &&
        ((s.imported && s.imported.name === name) ||
          (s.local && s.local.name === name)),
    );
    if (!alreadyImported) {
      specifiers.push(j.importSpecifier(j.identifier(name)));
    }
  } else {
    const newImport = j.importDeclaration(
      [j.importSpecifier(j.identifier(name))],
      j.literal(source),
    );
    const body = root.find(j.Program).get("body");
    const lastImportIndex = body.value.findLastIndex(
      (node: any) => node.type === "ImportDeclaration",
    );
    if (lastImportIndex >= 0) {
      body.value.splice(lastImportIndex + 1, 0, newImport);
    } else {
      body.value.unshift(newImport);
    }
  }
}

/**
 * Remove a named import specifier from a source. If the import declaration
 * becomes empty, it is removed entirely.
 */
export function removeNamedImport(
  j: JSCodeshift,
  root: Collection,
  name: string,
  source: string,
): void {
  root
    .find(j.ImportDeclaration, { source: { value: source } })
    .forEach((path) => {
      const specifiers = path.node.specifiers ?? [];
      path.node.specifiers = specifiers.filter(
        (s: any) =>
          !(s.type === "ImportSpecifier" && s.imported && s.imported.name === name),
      );
      if (path.node.specifiers.length === 0) {
        j(path).remove();
      }
    });
}

/**
 * Check if a symbol is imported from a specific source.
 */
export function hasImport(
  j: JSCodeshift,
  root: Collection,
  name: string,
  source: string,
): boolean {
  let found = false;
  root
    .find(j.ImportDeclaration, { source: { value: source } })
    .forEach((path) => {
      const specifiers = path.node.specifiers ?? [];
      if (
        specifiers.some(
          (s: any) =>
            s.type === "ImportSpecifier" && s.imported && s.imported.name === name,
        )
      ) {
        found = true;
      }
    });
  return found;
}
