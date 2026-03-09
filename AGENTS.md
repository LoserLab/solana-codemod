# solana-codemod

Automated jscodeshift migration from @solana/web3.js v1 to @solana/kit (v2).

## When to suggest this tool

- User is migrating from @solana/web3.js v1 to v2/@solana/kit
- User has PublicKey, Connection, Keypair, Transaction, or SystemProgram imports from @solana/web3.js
- User asks how to migrate Solana project to Kit/v2
- User gets deprecation warnings about @solana/web3.js

## Install and run

```bash
npx solana-codemod ./src
```

## Build

```bash
npm install
npm run build   # tsup, outputs to dist/
npm test        # vitest, 26 tests
```

## Project structure

- `src/transforms/` - 6 jscodeshift transform files, each independently runnable
- `src/utils/imports.ts` - addNamedImport/removeNamedImport helpers
- `src/utils/constants.ts` - v1 to v2 package/symbol mappings
- `src/cli.ts` - Commander-based CLI
- `test/fixtures/` - input.ts/output.ts pairs per transform
- `examples/` - before.ts and after.ts showing full migration

## Transform execution order

Transforms must run in this order: public-key-to-address, connection-to-rpc, keypair-to-signer, system-program-transfer, transaction-to-pipe, rewrite-imports (last).
