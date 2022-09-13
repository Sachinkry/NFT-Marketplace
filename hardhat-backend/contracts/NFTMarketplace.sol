// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {
    struct Listing {
        uint256 price;
        address seller;
    }

    // mapping: nftAddress => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    // Modifiers
    // requires that msg.sender is the owner of the nft
    modifier isNFTOwner(address nftAddress, uint256 tokenId) {
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "MRKT: not the owner!");
        _;
    }

    // requires that the specified nft is not already listed for sale
    modifier isNotListed(address nftAddress, uint256 tokenId) {
        require(listings[nftAddress][tokenId].price == 0, "MRKT: already listed!");
        _;
    }

    // requires that specified nft is already listed for sale
    modifier isListed(address nftAddress, uint256 tokenId) {
        require(listings[nftAddress][tokenId].price > 0, "MRKT: not listed");
        _;
    }

    // EVENT
    event ListingCreated(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );

    event ListingCanceled(
        address nftAddress, 
        uint256 tokenId, 
        address seller
    );

    event ListingUpdated(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice,
        address seller
    );
    
    event ListingPurchased(
        address nftAddress,
        uint256 tokenId,
        address seller,
        address buyer
    );

    function createListing(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )   external 
        isNFTOwner(nftAddress, tokenId) 
        isNotListed(nftAddress, tokenId) 
    {
        // cannot create listing for Eth less than 0
        require(price > 0, "MRKT: price must be > 0");

        // check if the caller is owner of the nft and has approved the marketplace contract to transfer on their behalf
        IERC721 nftContract = IERC721(nftAddress);
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) || nftContract.getApproved(tokenId) == address(this),
            "MRKT: No approval for NFT"
        );

        // add the listing to our mapping
        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        // emit event
        emit ListingCreated(nftAddress, tokenId, price, msg.sender);
    }


    function cancelListing(address nftAddress, uint256 tokenId)     external
        isNFTOwner(nftAddress, tokenId)
        isListed(nftAddress, tokenId)
    {
        // delete the listing corresponding tokenId/listing
        // Freeing up storage saves gas
        delete listings[nftAddress][tokenId];

        // emit the event
        emit ListingCanceled(nftAddress, tokenId, msg.sender);
    }

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) 
        external
        isNFTOwner(nftAddress, tokenId)
        isListed(nftAddress, tokenId)
    {
        // make sure new price is > 0
        require(newPrice > 0, "MRKT: Price must be > 0");

        // update the listing 
        listings[nftAddress][tokenId].price = newPrice;

        // emit the event
        emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
    }

    function purchaseListing(address nftAddress, uint256 tokenId) 
        external
        payable
        isListed(nftAddress, tokenId)
    {
        // load the listing in a local copy
        Listing memory listing = listings[nftAddress][tokenId];

        // buyer must have sent enough eth
        require(msg.value == listing.price, "MRKT: incorrect value");

        // delete the listing from the storage - save some gas!
        delete listings[nftAddress][tokenId];

        // transfer nft from seller to buyer
        IERC721(nftAddress).safeTransferFrom(
            listing.seller,
            msg.sender,
            tokenId
        );

        // transfer eth from buyer to seller
        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Failed to transfer ETH!");

        // emit the event
        emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
    }
}