import dotenv from "dotenv";

import { Keypair, PublicKey } from "@solana/web3.js";
import { createAccount, createAssociatedTokenAccountIdempotent, withdrawWithheldTokensFromAccounts } from "@solana/spl-token";
import { getTransferFeeAmount, TOKEN_2022_PROGRAM_ID, unpackAccount } from "@solana/spl-token";

import { connection, tokenConfig } from "./config";
import { generateExplorerTxUrl, secretKeyToBytes } from "./services/services";
import tokenMinted from "./assets/token_minted.json";

dotenv.config();

// Generate keys for payer, mint authority, and mint
const privateKeyBytes = secretKeyToBytes(process.env.PRIVATE_KEY);
const mintAuthority = Keypair.fromSecretKey(privateKeyBytes);
const tokenAddress = new PublicKey(tokenMinted.publickey);

const tokenMintInfo = {
	transferFeeOwner: new PublicKey(tokenConfig.transferFeeOwner),
	withdrawFeeOwner: new PublicKey(tokenConfig.withdrawFeeOwner),
}

const getDestinationAccount = async () => {
	// Random keypair to use as owner of Token Account
	const randomKeypair = new Keypair();

	// Create Token Account for random keypair
	const destinationTokenAccount = await createAccount(
		connection,
		mintAuthority, // Payer to create Token Account
		tokenAddress, // Mint Account address
		randomKeypair.publicKey, // Token Account owner
		undefined, // Optional keypair, default to Associated Token Account
		undefined, // Confirmation options
		TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
	)

	return destinationTokenAccount;
}

// Step 1 - Fetch Fee Accounts
const fetchFeeAccounts = async () => {
	const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
		commitment: "confirmed",
		filters: [{
			memcmp: {
				offset: 0,
				bytes: tokenAddress.toString()
			}
		}]
	})

	const accountsToWithdrawFrom: PublicKey[] = [];
	for (const accountInfo of allAccounts) {
		const account = unpackAccount(
			accountInfo.pubkey, // Token Account address
			accountInfo.account, // Token Account data
			TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
		)

		// Extract transfer fee data from each account
		const transferFeeAmount = getTransferFeeAmount(account);

		// Check if fees are available to be withdrawn
		if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
			accountsToWithdrawFrom.push(accountInfo.pubkey);
		}
	}

	return accountsToWithdrawFrom;
}

// Step 2 - Harvest Fees
const harvestFees = async (accountsToWithdrawFrom: PublicKey[]) => {
	const destinationTokenAccount = await getDestinationAccount();

	// Withdraw withheld tokens from Token Accounts
	const withdrawSig = await withdrawWithheldTokensFromAccounts(
		connection,
		mintAuthority, // Transaction fee payer
		tokenAddress, // Mint Account address
		destinationTokenAccount, // Destination account for fee withdrawal
		tokenMintInfo.withdrawFeeOwner, // Authority for fee withdrawal
		[], // Additional signers
		accountsToWithdrawFrom, // Token Accounts to withdrawal from
	)

	return generateExplorerTxUrl(withdrawSig);
}

async function withdrawFee() {
	const fetchFees = await fetchFeeAccounts();
	console.log("fetch_fee_accounts: ", fetchFees);

	const harvestFee = await harvestFees(fetchFees);
	console.log("harvest_fees: ", harvestFee);
}

// Execute the main function
withdrawFee();