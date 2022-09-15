import { useState, useEffect } from "react";
import { useAccount, useContract, useProvider, erc721ABI } from "wagmi";
import styles from "../styles/Listing.module.css";
import { formatEther } from "ethers/lib/utils";

export default function Listing(props) {
    // State variables to hold information about NFT
    const [imageURI, setImageURI] = useState("");
    const [name, setName] = useState("");
    // loading state
    const [loading, setLoading] = useState(true);

    // get provider, connected address, and a contract instance for the NFT contract using wagmi
    const provider = useProvider();
    const { address } = useAccount();
    const ERC721Contract = useContract({
        addressOrName: props.nftAddress,
        contractInterface: erc721ABI,
        signerOrProvider: provider,
    });

    // Check if the NFT seller is the connected address
    const isOwner = address.toLowerCase() === props.seller.toLowerCase();

    // fetch NFT details by resolving the token URI
    async function fetchNFTDetails() {
        try {
            // get the token URI from the contract
            let tokenURI = await ERC721Contract.tokenURI(0);
            // if it's an IPFS url, replace it with an HTTP gateway link
            tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

            // resolve the tokenURI
            const metadata = await fetch(tokenURI);
            const metadataJSON = await metadata.json();

            // Extract image URI from the metadata
            let image = metadataJSON.imageUrl;
            // if it's an IPFS url, replace it with an HTTP gateway link
            image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

            // update state variables
            setName(metadataJSON.name);
            setImageURI(image);
            setLoading(false);
            console.log("imageuri: ", imageURI);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    }

    // fetch the nft details when the component is loaded
    useEffect(() => {
        fetchNFTDetails();
    }, []);

    return (
        <div>
            {loading ? (
                <span>Loading...</span>
            ) : (
                <div className={styles.card}>
                    <img src={imageURI} />
                    <div className={styles.container}>
                        <span>
                            <b>
                                {name} - #{props.tokenId}
                            </b>
                        </span>
                        <span>Price: {formatEther(props.price)} CELO</span>
                        <span>
                            Seller: {isOwner ? "You" : props.seller.substring(0, 6) + "..."}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}