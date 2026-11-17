import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Execute the production TypeScript in memory; only explicitly supplied boundaries are replaced.
export function createSourceLoader(overrides = {}) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    const nativeRequire = createRequire(filename);
    const requireSource = (specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
      if (specifier.startsWith("@/")) {
        const source = resolve(frontendRoot, "src", specifier.slice(2));
        return load(existsSync(`${source}.ts`) ? `${source}.ts` : `${source}.tsx`);
      }
      if (specifier.startsWith(".")) {
        for (const extension of [".ts", ".tsx"]) {
          const sibling = resolve(dirname(filename), `${specifier}${extension}`);
          if (existsSync(sibling)) return load(sibling);
        }
      }
      return nativeRequire(specifier);
    };
    const execute = runInThisContext(`(function(require, module, exports) {\n${compiled.outputText}\n})`, { filename });
    execute(requireSource, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return (path) => load(resolve(frontendRoot, path));
}

export function createBffLoader(session = { token: "core-issued-dentistry-token" }) {
  return createSourceLoader({
    "server-only": {},
    "next/headers": {
      cookies: async () => ({
        get: (name) => name === "crowant_dentistry_access" && session.token ? { value: session.token } : undefined,
      }),
    },
    "@/infrastructure/config/server-env": {
      serverEnv: { dentistryApiUrl: new URL("http://dentistry.test:3004") },
    },
  });
}
