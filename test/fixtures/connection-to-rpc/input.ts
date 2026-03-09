import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const balance = await connection.getBalance(new PublicKey("abc"));
const info = await connection.getAccountInfo(new PublicKey("def"));
