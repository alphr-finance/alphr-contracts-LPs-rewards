import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-typechain';
import { MAINNET_URL_ALCHEMY } from './wallet';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url: MAINNET_URL_ALCHEMY,
        blockNumber: 12414448,
      },
    },
  },
  solidity: {
    version: '0.7.5',
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
  typechain: {
    target: 'ethers-v5',
    outDir: 'typechain',
  },
};
export default config;
