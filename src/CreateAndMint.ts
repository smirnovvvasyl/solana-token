import fs from 'fs';
import dotenv from "dotenv";

import { mintTo, transferCheckedWithFee, getMintLen } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID, createInitializeTransferFeeConfigInstruction } from "@solana/spl-token";
import { ExtensionType, createInitializeMintInstruction, createAssociatedTokenAccountIdempotent } from "@solana/spl-token";
import { sendAndConfirmTransaction, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import { connection, tokenConfig } from "./config";
import { bytesToSecretKey, decodeToBigNumber } from "./services/services";
import { generateExplorerTxUrl, secretKeyToBytes } from "./services/services";

dotenv.config();

// Generate keys for payer, mint authority, and mint
const privateKeyBytes = secretKeyToBytes(process.env.PRIVATE_KEY);
const mintAuthority = Keypair.fromSecretKey(privateKeyBytes);

// Generate keys for token publickkey
const mintKeypair = Keypair.generate();
const tokenAddress = mintKeypair.publicKey;

// Define the extensions to be used by the mint
const extensions = [ExtensionType.TransferFeeConfig];

// Calculate the length of the mint
const mintLen = getMintLen(extensions);

const tokenMintInfo = {
	decimals: tokenConfig.decimals,
	feeBasisPoints: tokenConfig.feeBasisPoints,
	maxFee: decodeToBigNumber(tokenConfig.maxFee),
	totalSupply: decodeToBigNumber(tokenConfig.mintAmount),
	transferFeeOwner: new PublicKey(tokenConfig.transferFeeOwner),
	withdrawFeeOwner: new PublicKey(tokenConfig.withdrawFeeOwner),
	transferAmount: decodeToBigNumber(1_000), // Transfer 1,000 tokens
}

const getSourceAccount = async () => {
	const owner = mintAuthority; // currently the mintAuthority is the token owner

	const sourceAccount = await createAssociatedTokenAccountIdempotent(
		connection,
		mintAuthority,
		tokenAddress,
		owner.publicKey,
		{},
		TOKEN_2022_PROGRAM_ID
	)

	return sourceAccount;
}

// Step 1 Airdrop to owner
const getAirdropDevnet = async () => {
	const airdropSignature = await connection.requestAirdrop(mintAuthority.publicKey, 1 * LAMPORTS_PER_SOL);
	await connection.confirmTransaction({ signature: airdropSignature, ...(await connection.getLatestBlockhash()) });
	return true;
}

// Step 2 - Create a New Token
const createNewToken = async () => {
	const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);

	const mintTransaction = new Transaction().add(
		SystemProgram.createAccount({
			fromPubkey: mintAuthority.publicKey,
			newAccountPubkey: tokenAddress,
			space: mintLen,
			lamports: mintLamports,
			programId: TOKEN_2022_PROGRAM_ID,
		}),

		createInitializeTransferFeeConfigInstruction(
			tokenAddress,
			tokenMintInfo.transferFeeOwner,
			tokenMintInfo.withdrawFeeOwner,
			tokenMintInfo.feeBasisPoints,
			tokenMintInfo.maxFee,
			TOKEN_2022_PROGRAM_ID
		),

		createInitializeMintInstruction(
			tokenAddress,
			tokenMintInfo.decimals,
			mintAuthority.publicKey,
			null,
			TOKEN_2022_PROGRAM_ID
		)
	)

	const newTokenTx = await sendAndConfirmTransaction(connection, mintTransaction, [mintAuthority, mintKeypair], undefined);

	return {
		explorer: generateExplorerTxUrl(newTokenTx),
		publickey: mintKeypair.publicKey.toString(),
		privatekey: bytesToSecretKey(mintKeypair.secretKey)
	}
}

// Step 3 - Mint tokens to Owner
const mintTokensToOwner = async () => {
	const sourceAccount = await getSourceAccount();

	const mintSig = await mintTo(
		connection,
		mintAuthority,
		tokenAddress,
		sourceAccount,
		mintAuthority,
		tokenMintInfo.totalSupply,
		[],
		undefined,
		TOKEN_2022_PROGRAM_ID
	)

	return generateExplorerTxUrl(mintSig);
}

// Step 4 - Send Tokens from Owner to a New Account
const checkTransferFee = async () => {
	const destinationOwner = Keypair.generate();
	const sourceAccount = await getSourceAccount();
	const owner = mintAuthority; // currently the mintAuthority is the token owner

	// Calculate the fee for the transfer
	const feePercente = BigInt(tokenMintInfo.feeBasisPoints);
	const calcFee = tokenMintInfo.transferAmount * feePercente / BigInt(10_000); // expect 20 fee
	const fee = calcFee > tokenMintInfo.maxFee ? tokenMintInfo.maxFee : calcFee; // expect 20 fee

	const destinationAccount = await createAssociatedTokenAccountIdempotent(
		connection,
		mintAuthority,
		tokenAddress,
		destinationOwner.publicKey,
		{},
		TOKEN_2022_PROGRAM_ID
	)

	const transferSig = await transferCheckedWithFee(
		connection,
		mintAuthority,
		sourceAccount,
		tokenAddress,
		destinationAccount,
		owner,
		tokenMintInfo.transferAmount,
		tokenMintInfo.decimals,
		fee,
		[]
	)

	return generateExplorerTxUrl(transferSig);
}

async function startMintToken() {
	// const airdropStatus = await getAirdropDevnet();
	// console.log("getAirdropStatus: ", airdropStatus);

	const createdToken = await createNewToken();
	console.log("New_Token_Created: ", createdToken);

	const mintTokens = await mintTokensToOwner();
	console.log("Tokens_Minted: ", mintTokens);

	const checkFee = await checkTransferFee();
	console.log("check_transfer_fee: ", checkFee);

	const store_path = "./src/assets/token_minted.json";
	fs.writeFile(store_path, JSON.stringify(createdToken, null, 4), () => {
		console.log("token_metadata_upload_completed");
	})
}

// Execute the main function
startMintToken();