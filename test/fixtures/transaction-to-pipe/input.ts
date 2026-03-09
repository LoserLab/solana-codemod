import { Transaction } from "@solana/web3.js";

const tx = new Transaction();
tx.add(instruction1);
tx.add(instruction2);
tx.feePayer = payerPublicKey;
tx.recentBlockhash = blockhash;

const chained = new Transaction().add(ix1).add(ix2);
