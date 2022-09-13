import { store } from "@graphprotocol/graph-ts"
import {
  ListingCanceled,
  ListingCreated,
  ListingPurchased,
  ListingUpdated
} from "../generated/NFTMarketplace/NFTMarketplace"
import { ListingEntity } from "../generated/schema"

export function handleListingCanceled(event: ListingCanceled): void {
  // create id
  const id =  
     event.params.nftAddress.toHex() +
     "_" +
     event.params.tokenId.toString() +
     "_" + 
     event.params.seller.toHex();
  
  // load the listing to see if exists
  let listing = ListingEntity.load(id);

  // if it does
  if (listing) {
    // remove it from the store
    store.remove("ListingEntity", id);
  }

}

export function handleListingCreated(event: ListingCreated): void {
  // create a unique ID that refers to this listing
  // nftAddress + tokenId + seller address => can be used to refer to a specific listing
  const id =  
     event.params.nftAddress.toHex() +
     "_" +
     event.params.tokenId.toString() +
     "_" + 
     event.params.seller.toHex();

  // create a new listing and assign it's ID
  let listing = new ListingEntity(id);
  
  // set the properties of the listing, as defined in the schema, based on the event
  listing.seller = event.params.seller;
  listing.nftAddress = event.params.nftAddress;
  listing.tokenId = event.params.tokenId;
  listing.price = event.params.price;

  // save the listing to the nodes, so we can query it later
  listing.save();
}

export function handleListingPurchased(event: ListingPurchased): void {
  // recreate the id
  // since the listing is updated, the datastore must have an entity with from when the listing was created
  const id = 
      event.params.nftAddress.toHex() +
      "_" + 
      event.params.tokenId.toString() +
      "_" +
      event.params.seller.toHex();

  // try to load the listing
  let listing = ListingEntity.load(id);

  // if it exists
  if (listing) {
    // set the buyer
    listing.buyer = event.params.buyer;
    // save the changes
    listing.save();
  }

}

export function handleListingUpdated(event: ListingUpdated): void {
  // recreate the ID that refers to the listing
  // since we are updating a listing, this id must be there already 
  const id = 
      event.params.nftAddress.toHex() +
      "_" + 
      event.params.tokenId.toString() +
      "_" +
      event.params.seller.toHex();

  // attempt to load a pre-existing entity using id
  let listing = ListingEntity.load(id);

  // if exists
  if (listing) {
    // update the price
    listing.price = event.params.newPrice;
    // save the changes
    listing.save();
  }
}
