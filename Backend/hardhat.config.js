require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    ganache: {
      url: process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545",
      chainId: process.env.GANACHE_CHAIN_ID ? Number(process.env.GANACHE_CHAIN_ID) : 1337,
      accounts: process.env.GANACHE_PRIVATE_KEY
        ? [process.env.GANACHE_PRIVATE_KEY]
        : process.env.PRIVATE_KEY
          ? [process.env.PRIVATE_KEY]
          : undefined,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || process.env.ALCHEMY_SEPOLIA_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : process.env.PRIVATE_KEY
          ? [process.env.PRIVATE_KEY]
          : [],
    },
  },
};
