import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar';
import Listing from "../components/Listing"
import Link from 'next/link';
import { createClient } from 'urql';
import { SUBGRAPH_URL } from "../constants";
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export default function Home() {
  // State variables to contain active listings and signigy a loading state
  const [listings, setListings] = useState();
  const [loading, setLoading] = useState(false);

  const { isConnected } = useAccount();

  // Function to fetch listing from the subgraph
  async function fetchListings() {
    setLoading(true);
    try {
      // The graphQL query to run
      const listingsQuery = `
           query ListingsQuery {
             listingEntities {
               id 
               nftAddress
               tokenId
               price
               seller
               buyer
             }
           }
        `;

      // Create a urql client
      const urqlClient = createClient({
        url: SUBGRAPH_URL,
      });

      // Send the query to the subgraph graphQL API, and get the response

      const response = await urqlClient.query(listingsQuery).toPromise();
      const listingEntities = response.data.listingEntities;

      // Filter out active listings i.e ones that have not been sold yet
      const activeListings = listingEntities.filter((l) => l.buyer === null);

      // Update state variables
      setListings(activeListings);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }

  }

  // Fetch listings on page load once walletconnect exists
  useEffect(() => {
    if (isConnected) {
      fetchListings();
    }
    console.log(loading, listings);
  }, []);

  return (
    <>
      {/* add Navbar to Home page */}
      <Navbar />

      {/* Show loading status if query hasn't responded yet */}
      {loading && isConnected && <span>Loading...</span>}

      {/* Render the listings */}
      <div className={styles.container}>

        {!loading &&
          listings &&
          listings.map(listing => {
            return (
              <Link
                key={listing.id}
                href={`/${listing.nftAddress}/${listing.tokenId}`}
              >
                <a>
                  <Listing
                    nftAddress={listing.nftAddress}
                    tokenId={listing.tokenId}
                    price={listing.price}
                    seller={listing.seller}
                  />
                </a>
              </Link>
            )
          })
        }
      </div>

      {/* Show *no listings found* if query returned empty */}
      {!loading && listings && listings.length === 0 && <span>No listings found</span>}
    </>
  );
}
