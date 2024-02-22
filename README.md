# Create and Mint process

## Create a SPL token-2022

1. Create a spl token-2022 using `src/CreateAndMint.ts`

   - install package

   ```sh
   yarn install
   ```

   - simply run this command

   ```sh
   yarn start
   ```

   - You can change metada and token mint information from /src/config.ts

2. Get mint account from output.

   - Please get mint account address /src/assets/token_minted.json

## Create a metadata for mint

If you check the mint address, you can see unrecognized token detail on explorer. We need to create a metadata and set it now. We use **metaplex**

1. Create a metadata with metaplex token standard using `src/CreateMetadata22.ts`

   - run this command

   ```sh
   yarn metadata
   ```

   - This script sets metadata of mint for you.

   - You can set metadata information from /src/config.ts

2. Done

Happy deploying!
