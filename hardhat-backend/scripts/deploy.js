const { ethers } = require("hardhat");

async function main() {
  // deploy the celoNFT contract
  const celoNFTFactory = await ethers.getContractFactory("CeloNFT");
  const celoNFTContract = await celoNFTFactory.deploy();
  await celoNFTContract.deployed();

  console.log("CeloNFT contract address: ", celoNFTContract.address);

  // deploy the NFTMarketplace contract
  const NFTMarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");
  const NFTMarketplaceContract = await NFTMarketplaceFactory.deploy();
  await NFTMarketplaceContract.deployed();

  console.log("NFTMarketplace contract address: ", NFTMarketplaceContract.address);
}

// call the main function and catch if there's an error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })