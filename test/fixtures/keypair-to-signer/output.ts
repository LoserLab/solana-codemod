import { Keypair } from "@solana/web3.js";

import { generateKeyPairSigner, createKeyPairSignerFromBytes, KeyPairSigner } from "@solana/kit";

async function createWallet() {
  const keypair = await generateKeyPairSigner();
  const pubkey = keypair.address;
  return pubkey;
}

async function loadWallet(secret: Uint8Array): KeyPairSigner {
  const keypair = await createKeyPairSignerFromBytes(secret);
  return keypair;
}
