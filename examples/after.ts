// After running: npx solana-codemod examples/before.ts
//
// This is the expected output after all transforms run in sequence:
// 1. public-key-to-address: PublicKey → address()
// 2. connection-to-rpc: Connection → createSolanaRpc()
// 3. keypair-to-signer: Keypair → generateKeyPairSigner()
// 4. system-program-transfer: SystemProgram.transfer → getTransferSolInstruction
// 5. transaction-to-pipe: new Transaction() + .add() → pipe()
// 6. rewrite-imports: Clean up @solana/web3.js, add @solana/kit imports

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  address,
  Address,
  createSolanaRpc,
  generateKeyPairSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  lamports,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

async function transferSol() {
  const connection = createSolanaRpc("https://api.mainnet-beta.solana.com");
  const sender = await generateKeyPairSigner();
  const recipient = address("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");

  const balance = await connection.getBalance(sender.address).send();
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  const instruction = getTransferSolInstruction({
    source: sender.address,
    destination: recipient,
    amount: lamports(1000000),
  });

  const { blockhash } = await connection.getLatestBlockhash().send();
  const tx = pipe(
    createTransactionMessage({ version: 0 }),
    (msg) => setTransactionMessageFeePayer(sender.address, msg),
    (msg) => setTransactionMessageLifetimeUsingBlockhash(blockhash, msg),
    (msg) => appendTransactionMessageInstruction(instruction, msg),
  );

  console.log("Transaction built:", tx);
}

function getTokenMint(): Address {
  return address("So11111111111111111111111111111111111111112");
}
