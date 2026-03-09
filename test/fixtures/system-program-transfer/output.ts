import { SystemProgram, PublicKey } from "@solana/web3.js";

import { lamports } from "@solana/kit";
import { getTransferSolInstruction, getCreateAccountInstruction } from "@solana-program/system";

const ix = getTransferSolInstruction({
  source: sender,
  destination: recipient,
  amount: lamports(1000000),
});

const createIx = getCreateAccountInstruction({
  payer: payer,
  newAccount: newAccount,
  lamports: rent,
  space: 165,
  programAddress: TOKEN_PROGRAM_ID,
});
