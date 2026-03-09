import { Keypair } from "@solana/web3.js";

function createWallet() {
  const keypair = Keypair.generate();
  const pubkey = keypair.publicKey;
  return pubkey;
}

function loadWallet(secret: Uint8Array): Keypair {
  const keypair = Keypair.fromSecretKey(secret);
  return keypair;
}
