import dotenv from "dotenv";
import { Connection } from "@solana/web3.js";
import tokenMetadataUri from "./assets/metadata.json";

dotenv.config();
const isMainnet = false;

// Initialize connection to local Solana node
const solanaRpc = isMainnet ? "http://rpc.solscan.com" : "https://api.devnet.solana.com";
const connection = new Connection(solanaRpc, "confirmed");

const tokenConfig = {
	test: !isMainnet,
	decimals: 6,
	feeBasisPoints: 200, // 2%
	maxFee: 1000000000000, // $tokens
	mintAmount: 1000000000000, // trillion

	// Token Metadata
	name: "TARD",
	symbol: "$TARD",
	uri: tokenMetadataUri.uri,
	description: "",
}

const ipfsConfig = {
	baseUrl: process.env.IPFS_BASEURL,
	host: process.env.IPFS_HOST,
	port: process.env.IPFS_PORT,
	opt: process.env.IPFS_OPT,
}

export { connection, tokenConfig, ipfsConfig, solanaRpc }