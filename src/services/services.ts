import bs58 from "bs58";
import { connection, tokenConfig } from "../config";

const getBalance = async (publicKey: any) => {
	const balance = await connection.getBalance(publicKey);
	const balanceSOL = encodeFromBigNumber(balance);
	return balanceSOL;
}

const secretKeyToBytes = (privateKey: string) => {
	return bs58.decode(privateKey);
}

const bytesToSecretKey = (bytes: any) => {
	return bs58.encode(bytes);
}

const decodeToBigNumber = (num: number): bigint => {
	return BigInt(num * Math.pow(10, tokenConfig.decimals))
}

const encodeFromBigNumber = (bigNumber: bigint | number): number => {
	return Number(bigNumber) / Math.pow(10, tokenConfig.decimals)
}

// Helper function to generate Explorer URL
const generateExplorerTxUrl = (txId: string): string => {
	return `https://explorer.solana.com/tx/${txId}${tokenConfig.test ? '?cluster=devnet' : ''}`;
}

export {
	getBalance,

	secretKeyToBytes,
	bytesToSecretKey,

	decodeToBigNumber,
	encodeFromBigNumber,

	generateExplorerTxUrl,
}