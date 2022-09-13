require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

// environment variable are now accessible
PRIVATE_KEY = process.env.PRIVATE_KEY;
RPC_URL = process.env.RPC_URL;

// show an error if env. var. are missing
if (!PRIVATE_KEY) {
  console.error("Error: Private key missing!");
}

if (!RPC_URL) {
  console.error("Error: RPC_URL missing!");
}

module.exports = {
  solidity: "0.8.9",
  networks: {
    alfajores: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
};
