import dotenv from "dotenv";
import * as bs58 from "bs58";
import * as web3 from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey, createSignerFromKeypair, none, percentAmount, publicKey, signerIdentity, some } from "@metaplex-foundation/umi";
import { TokenStandard, CollectionDetails, PrintSupply, UpdateV1InstructionAccounts, Data } from "@metaplex-foundation/mpl-token-metadata";
import { createV1, updateV1, Collection, Creator, Uses, CreateV1InstructionAccounts, CreateV1InstructionData } from "@metaplex-foundation/mpl-token-metadata";

import { solanaRpc, tokenConfig } from "./config";
import { secretKeyToBytes } from "./services/services";
import tokenMinted from "./assets/token_minted.json";

dotenv.config();

const INITIALIZE = true;
const SPL_TOKEN_2022_MINT = tokenMinted.publickey;
const SPL_TOKEN_2022_PROGRAM_ID: PublicKey = publicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

const tokenMetadata = {
  name: tokenConfig.name,
  symbol: tokenConfig.symbol,
  uri: tokenConfig.uri,
  sellerFeeBasisPoints: tokenConfig.feeBasisPoints,
}

async function main() {
  // Load wallet key pair from private key hex of env
  const privateKeyBytes = secretKeyToBytes(process.env.PRIVATE_KEY);
  const mintAuthority = web3.Keypair.fromSecretKey(privateKeyBytes);
  const mint = new web3.PublicKey(SPL_TOKEN_2022_MINT);

  const umi = createUmi(solanaRpc);
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(mintAuthority));
  umi.use(signerIdentity(signer, true));

  if (INITIALIZE) {
    const onChainData = {
      ...tokenMetadata,
      // we don't need that
      sellerFeeBasisPoints: percentAmount(tokenConfig.feeBasisPoints / 100, 2),
      creators: none<Creator[]>(),
      collection: none<Collection>(),
      uses: none<Uses>(),
    }

    const accounts: CreateV1InstructionAccounts = {
      mint: fromWeb3JsPublicKey(mint),
      splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
    }

    const data: CreateV1InstructionData = {
      ...onChainData,
      isMutable: true,
      discriminator: 0,
      tokenStandard: TokenStandard.Fungible,
      collectionDetails: none<CollectionDetails>(),
      ruleSet: none<PublicKey>(),
      createV1Discriminator: 0,
      primarySaleHappened: true,
      decimals: none<number>(),
      printSupply: none<PrintSupply>(),
    }

    const txid = await createV1(umi, { ...accounts, ...data }).sendAndConfirm(umi);
    console.log(bs58.encode(txid.signature));
  } else {
    const onChainData = {
      ...tokenMetadata,
      sellerFeeBasisPoints: tokenConfig.feeBasisPoints,
      creators: none<Creator[]>(),
      collection: none<Collection>(),
      uses: none<Uses>(),
    }

    const accounts: UpdateV1InstructionAccounts = {
      mint: fromWeb3JsPublicKey(mint),
    }

    const data = {
      discriminator: 0,
      data: some<Data>(onChainData),
      updateV1Discriminator: 0,
    }

    const txid = await updateV1(umi, { ...accounts, ...data }).sendAndConfirm(umi);
    console.log(bs58.encode(txid.signature));
  }
}

main();
