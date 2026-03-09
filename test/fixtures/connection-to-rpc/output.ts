import { Connection, PublicKey } from "@solana/web3.js";

import { createSolanaRpc } from "@solana/kit";

const connection = createSolanaRpc("https://api.mainnet-beta.solana.com");
const balance = await connection.getBalance(new PublicKey("abc")).send();
const info = await connection.getAccountInfo(new PublicKey("def")).send();
