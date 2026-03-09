import { Transaction } from "@solana/web3.js";

import {
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  pipe,
  createTransactionMessage,
} from "@solana/kit";

const tx = pipe(createTransactionMessage({
  version: 0
}), msg => setTransactionMessageFeePayer(payerPublicKey, msg), msg => setTransactionMessageLifetimeUsingBlockhash(blockhash, msg), msg => appendTransactionMessageInstructions([instruction1, instruction2], msg));

const chained = pipe(createTransactionMessage({
  version: 0
}), msg => appendTransactionMessageInstructions([ix1, ix2], msg));
