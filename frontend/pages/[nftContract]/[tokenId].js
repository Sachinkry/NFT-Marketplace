import { Contract } from "ethers";
import { parseEther, formatEther } from "ethers/lib/utils";
import { printSourceLocation } from "graphql";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { createClient } from "urql";
import { useContract, useSigner, erc721ABI } from "wagmi";
import MarketplaceABI from "../../abi/NFTMarketplace.json";
import Navbar from "../../components/Navbar";
import { MARKETPLACE_ADDRESS, SUBGRAPH_URL } from "../../constants";
import styles from "../../styles/Details.module.css";

export default function NFTDetails() {
    // Extract nft contract address and token ID from URL
    const router = useRouter();
    const nftAddress = router.query.nftContract;
    const tokenId = router.query.tokenId;

    // State variables to contain NFT and listing information
    const [listing, setListing] = useState();
    const [name, setName] = useState("");
    const [imageURI, setImageURI] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // state varibale to contain new price if updating listed
    const [newPrice, setNewPrice] = useState("");

    // State variables to contain various loading states
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [buying, setBuying] = useState(false);

    // fetch signer from wagmi
    const { data: signer } = useSigner();
    const MarketplaceContract = useContract({
        addressOrName: MARKETPLACE_ADDRESS,
        contractInterface: MarketplaceABI,
        signerOrProvider: signer,
    });

    async function fetchListing() {
        const listingQuery = `
           query ListingQuery {
             listingEntities(where: {
                nftAddress: "${nftAddress}"
                tokenId: "${tokenId}"
             }) {
                id
                nftAddress
                tokenId
                price 
                seller
                buyer
             }
           }
        `;

        const urqlClient = createClient({ url: SUBGRAPH_URL });

        // send the query to the subgraph graphQL API and get the response
        const response = await urqlClient.query(listingQuery).toPromise();
        const listingEntities = response.data.listingEntities;

        // if no active listing is found with the given parameters
        // inform user of the error and return to homepage
        if (listingEntities.length === 0) {
            window.alert("Listing does not exist or has been cancled!");
            return router.push("/");
        }

        // grab the first one which should be the only one matching the parameters
        const listing = listingEntities[0];
        const address = await signer.getAddress();

        // Update the state variable
        setIsActive(listing.buyer === null);
        setIsOwner(address.toLowerCase() === listing.seller.toLowerCase());
        setListing(listing);
    }

    // Function to fetch NFT details from it's metadata
    async function fetchNFTDetails() {
        const ERC721Contract = new Contract(nftAddress, erc721ABI, signer);
        let tokenURI = await ERC721Contract.tokenURI(tokenId);
        tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

        const metadata = await fetch(tokenURI);
        const metadataJSON = await metadata.json();

        let image = metadataJSON.imageUrl;
        image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

        setName(metadataJSON.name);
        setImageURI(image);
    }

    // Function to call 'updateListing' in the smart contract
    async function updateListing() {
        setUpdating(true);

        const updateTxn = await MarketplaceContract.updateListing(
            nftAddress,
            tokenId,
            parseEther(newPrice)
        );

        await updateTxn.wait();
        await fetchListing();
        setUpdating(false);
    }

    // Function to call 'cancelListing' in the smart contract
    async function cancelListing() {
        setCanceling(true);
        const cancelTxn = await MarketplaceContract.cancelListing(
            nftAddress,
            tokenId
        );
        await cancelTxn.wait();
        window.alert("Lising Cancelled!");
        await router.push("/");
        setCanceling(false);
    }

    // Function to call 'buyListing' in the smart contract
    async function buyListing() {
        setBuying(true);
        const buyTxn = await MarketplaceContract.purchaseListing(
            nftAddress,
            tokenId,
            {
                value: listing.price,
            }
        );
        await buyTxn.wait();
        await fetchListing();
        setBuying(false);
    }

    // Load listing and NFT data on page load
    useEffect(() => {
        if (router.query.nftContract && router.query.tokenId && signer) {
            Promise.all([fetchListing(), fetchNFTDetails()]).finally(() => {
                setLoading(false);
            })
        }
    }, [router, signer]);


    return (
        <>
            <Navbar />
            <div>
                {loading ? (
                    <span>Loading...</span>
                ) : (
                    <div className={styles.container}>
                        <div className={styles.details}>
                            <img src={imageURI} />
                            <span>
                                <b>
                                    {name} - #{tokenId}
                                </b>
                            </span>
                            <span>Price: {formatEther(listing.price)} CELO</span>
                            <span>
                                <a
                                    href={`https://alfajores.celoscan.io/address/${listing.seller}`}
                                    target="_blank"
                                >
                                    Seller:{" "}
                                    {isOwner ? "You" : listing.seller.substring(0, 6) + "..."}
                                </a>
                            </span>
                            <span>Status: {listing.buyer === null ? "Active" : "Sold"}</span>
                        </div>

                        <div className={styles.options}>
                            {!isActive && (
                                <span>
                                    Listing has been sold to{" "}
                                    <a
                                        href={`https://alfajores.celoscan.io/address/${listing.buyer}`}
                                        target="_blank"
                                    >
                                        {listing.buyer}
                                    </a>
                                </span>
                            )}

                            {isOwner && isActive && (
                                <>
                                    <div className={styles.updateListing}>
                                        <input
                                            type="text"
                                            placeholder="New Price (in CELO)"
                                            className={styles.input}
                                            value={newPrice}
                                            onChange={(e) => {
                                                if (e.target.value === "") {
                                                    setNewPrice("0");
                                                } else {
                                                    setNewPrice(e.target.value);
                                                }
                                            }}
                                        ></input>
                                    </div>
                                    <div className={styles.btnContainer}>

                                        <button
                                            disabled={updating}
                                            onClick={updateListing}
                                            className={styles.btn}
                                        >
                                            Update Listing
                                        </button>
                                        <button
                                            className={styles.btn}
                                            disabled={canceling}
                                            onClick={cancelListing}
                                        >
                                            Cancel Listing
                                        </button>
                                    </div>
                                </>
                            )}

                            {!isOwner && isActive && (
                                <button
                                    className={styles.btn}
                                    disabled={buying}
                                    onClick={buyListing}
                                >
                                    Buy Listing
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}