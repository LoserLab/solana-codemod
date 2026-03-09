/** Symbols imported from @solana/web3.js v1 that we transform */
export const V1_TRANSFORMED_SYMBOLS = [
  "PublicKey",
  "Connection",
  "Keypair",
  "Transaction",
  "SystemProgram",
] as const;

/** v2 import mappings when using @solana/kit (default) */
export const KIT_IMPORTS: Record<string, string> = {
  address: "@solana/kit",
  Address: "@solana/kit",
  createSolanaRpc: "@solana/kit",
  createSolanaRpcSubscriptions: "@solana/kit",
  generateKeyPairSigner: "@solana/kit",
  createKeyPairSignerFromBytes: "@solana/kit",
  KeyPairSigner: "@solana/kit",
  pipe: "@solana/kit",
  createTransactionMessage: "@solana/kit",
  setTransactionMessageFeePayer: "@solana/kit",
  setTransactionMessageLifetimeUsingBlockhash: "@solana/kit",
  appendTransactionMessageInstruction: "@solana/kit",
  appendTransactionMessageInstructions: "@solana/kit",
  lamports: "@solana/kit",
  getProgramDerivedAddress: "@solana/kit",
};

/** v2 import mappings when using scoped packages */
export const SCOPED_IMPORTS: Record<string, string> = {
  address: "@solana/addresses",
  Address: "@solana/addresses",
  getProgramDerivedAddress: "@solana/addresses",
  createSolanaRpc: "@solana/rpc",
  createSolanaRpcSubscriptions: "@solana/rpc-subscriptions",
  generateKeyPairSigner: "@solana/signers",
  createKeyPairSignerFromBytes: "@solana/signers",
  KeyPairSigner: "@solana/signers",
  pipe: "@solana/functional",
  createTransactionMessage: "@solana/transaction-messages",
  setTransactionMessageFeePayer: "@solana/transaction-messages",
  setTransactionMessageLifetimeUsingBlockhash: "@solana/transaction-messages",
  appendTransactionMessageInstruction: "@solana/transaction-messages",
  appendTransactionMessageInstructions: "@solana/transaction-messages",
  lamports: "@solana/rpc-types",
};

/** Imports that always come from their own package (not @solana/kit) */
export const EXTERNAL_IMPORTS: Record<string, string> = {
  getTransferSolInstruction: "@solana-program/system",
  getCreateAccountInstruction: "@solana-program/system",
};

/** SystemProgram method → v2 function name */
export const SYSTEM_PROGRAM_METHODS: Record<string, string> = {
  transfer: "getTransferSolInstruction",
  createAccount: "getCreateAccountInstruction",
};

/** SystemProgram.transfer property renames */
export const TRANSFER_PROP_RENAMES: Record<string, string> = {
  fromPubkey: "source",
  toPubkey: "destination",
};

/** SystemProgram.createAccount property renames */
export const CREATE_ACCOUNT_PROP_RENAMES: Record<string, string> = {
  fromPubkey: "payer",
  newAccountPubkey: "newAccount",
  programId: "programAddress",
};
