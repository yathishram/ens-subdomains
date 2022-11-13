require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

module.exports = {
  solidity: '0.8.17',
  networks: {
    goerli: {
      url: process.env.ALCHEMY_KEY,
      accounts: [process.env.GOERLI_PRIVATE_KEY],
    },
    mainnet: {
      blockExplorer: 'https://etherscan.io',
      url: process.env.ALCHEMY_KEY_MAINNET,
      accounts: [process.env.MAINNET_PRIVATE_KEY],
    },
  },
}
