import { SystemProgram, PublicKey } from "@solana/web3.js";

const ix = SystemProgram.transfer({
  fromPubkey: sender,
  toPubkey: recipient,
  lamports: 1000000,
});

const createIx = SystemProgram.createAccount({
  fromPubkey: payer,
  newAccountPubkey: newAccount,
  lamports: rent,
  space: 165,
  programId: TOKEN_PROGRAM_ID,
});
