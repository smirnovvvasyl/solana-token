import dotenv from "dotenv";
import { Connection } from "@solana/web3.js";
import tokenMetadataUri from "./assets/metadata.json";

dotenv.config();

// Initialize connection to local Solana node
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const tokenConfig = {
	test: true,
	decimals: 9,
	feeBasisPoints: 200, // 2%
	maxFee: 10_000_000_000, // $tokens
	mintAmount: 10_000_000_000, // trillion
	transferFeeOwner: "Pkx3U87UXRB7i6yrCupZ3XmJ2DhiKA8AgX75AQr7cEo", // keys for transfer fee config authority
	withdrawFeeOwner: "Pkx3U87UXRB7i6yrCupZ3XmJ2DhiKA8AgX75AQr7cEo", // keys for withdrawal authority

	// Token Metadata
	name: "Gold",
	symbol: "$GOLD",
	uri: tokenMetadataUri.uri,
	description: "A gold Solana SPL token :)",
}

const ipfsConfig = {
	baseUrl: process.env.IPFS_BASEURL,
	host: process.env.IPFS_HOST,
	port: process.env.IPFS_PORT,
	opt: process.env.IPFS_OPT,
}

export { connection, tokenConfig, ipfsConfig }