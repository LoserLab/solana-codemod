import { PublicKey } from "@solana/web3.js";

import { getProgramDerivedAddress, address, Address } from "@solana/kit";

const mint = address("So11111111111111111111111111111111111111112");
const owner = address(ownerString);
const str = mint;

function getKey(): Address {
  return address("11111111111111111111111111111111");
}

async function findPda(programId: Address) {
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [Buffer.from("seed")]
  });
  return pda;
}
