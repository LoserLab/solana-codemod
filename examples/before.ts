import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function transferSol() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const sender = Keypair.generate();
  const recipient = new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");

  const balance = await connection.getBalance(sender.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  const instruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient,
    lamports: 1000000,
  });

  const tx = new Transaction();
  tx.add(instruction);
  tx.feePayer = sender.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  console.log("Transaction built:", tx);
}

function getTokenMint(): PublicKey {
  return new PublicKey("So11111111111111111111111111111111111111112");
}
