import fs from 'fs';
import IPFS from 'ipfs-api';
import { ipfsConfig, tokenConfig } from './config';

const ipfs = new IPFS({
	host: ipfsConfig.host,
	port: ipfsConfig.port,
	protocol: ipfsConfig.opt
})

async function uploadTokenImage() {
	const image_file_path = "./src/assets/resources/image.jpg";
	const imageContents = fs.readFileSync(image_file_path);

	const uploadResult = await ipfs.files.add(imageContents);
	const image_ipfsurl = ipfsConfig.baseUrl + uploadResult[0].hash;

	return image_ipfsurl;
}

async function uploadTokenUri() {
	const tokenImageUrl = await uploadTokenImage();
	const store_path = "./src/assets/metadata.json";

	const tokenMetadata = {
		name: tokenConfig.name,
		symbol: tokenConfig.symbol,
		description: tokenConfig.description,
		image: tokenImageUrl
	}

	const bufferFile = Buffer.from(JSON.stringify(tokenMetadata));
	const uploadResult = await ipfs.files.add(bufferFile);
	const uri = ipfsConfig.baseUrl + uploadResult[0].hash;

	const metadataHashs = { image: tokenImageUrl, uri: uri }
	fs.writeFile(store_path, JSON.stringify(metadataHashs, null, 4), () => {
		console.log("token_metadata_upload_completed");
	})
}

uploadTokenUri();