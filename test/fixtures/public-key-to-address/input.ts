import { PublicKey } from "@solana/web3.js";

const mint = new PublicKey("So11111111111111111111111111111111111111112");
const owner = new PublicKey(ownerString);
const str = mint.toBase58();

function getKey(): PublicKey {
  return new PublicKey("11111111111111111111111111111111");
}

async function findPda(programId: PublicKey) {
  const [pda, bump] = await PublicKey.findProgramAddress(
    [Buffer.from("seed")],
    programId,
  );
  return pda;
}
