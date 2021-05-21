import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-typechain';
import 'hardhat-gas-reporter';
import { HardhatUserConfig } from 'hardhat/types';

const coinmarketcapAPIKey = '53cec9bc-a843-4e72-ab3b-8bf3df2fa87e';

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url:
          'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
        blockNumber: 12472213, //  DO NOT CHANGE!
      },
    },
  },
  solidity: {
    version: '0.7.6',
    settings: {
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  mocha: {
    bail: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS == 'false' ? false : true,
    currency: 'USD',
    coinmarketcap: coinmarketcapAPIKey,
  },
};
export default config;
