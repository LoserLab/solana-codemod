import { Command } from "commander";
import { run as jscodeshift } from "jscodeshift/src/Runner";
import path from "path";
import { TRANSFORM_ORDER } from "./index";

const TRANSFORMS_DIR = path.resolve(__dirname, "transforms");

export async function cli(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name("solana-codemod")
    .description(
      "Automated migration from @solana/web3.js v1 to @solana/kit (v2)",
    )
    .version("0.1.0")
    .argument("<path>", "Path to source files to transform")
    .option(
      "-t, --transform <names>",
      "Comma-separated list of transforms to run (default: all)",
    )
    .option("-d, --dry", "Dry run (no file writes)")
    .option("-p, --print", "Print output to stdout")
    .option(
      "--extensions <exts>",
      "File extensions to process",
      "ts,tsx,js,jsx",
    )
    .option(
      "--ignore-pattern <pattern>",
      "Glob pattern to ignore",
      "**/node_modules/**",
    )
    .action(async (targetPath, opts) => {
      const transforms = opts.transform
        ? opts.transform.split(",").map((t: string) => t.trim())
        : [...TRANSFORM_ORDER];

      // Validate transform names
      for (const t of transforms) {
        if (!TRANSFORM_ORDER.includes(t as any)) {
          console.error(
            `Unknown transform: "${t}". Available: ${TRANSFORM_ORDER.join(", ")}`,
          );
          process.exit(1);
        }
      }

      const resolvedPath = path.resolve(targetPath);
      const extensions = opts.extensions;
      const ignorePattern = opts.ignorePattern;

      console.log(`\nsolana-codemod v0.1.0`);
      console.log(`Target: ${resolvedPath}`);
      console.log(`Transforms: ${transforms.join(", ")}\n`);

      for (const transformName of transforms) {
        const transformPath = path.join(
          TRANSFORMS_DIR,
          `${transformName}.js`,
        );
        console.log(`Running: ${transformName}`);

        const result = await jscodeshift(transformPath, [resolvedPath], {
          dry: opts.dry ?? false,
          print: opts.print ?? false,
          verbose: 0,
          extensions,
          ignorePattern,
          parser: "tsx",
        });

        const { ok, nochange, skip, error } = result.stats ?? {};
        console.log(
          `  Changed: ${ok ?? 0}, Unchanged: ${nochange ?? 0}, Skipped: ${skip ?? 0}, Errors: ${error ?? 0}`,
        );
      }

      console.log("\nDone.");
    });

  await program.parseAsync(argv);
}
