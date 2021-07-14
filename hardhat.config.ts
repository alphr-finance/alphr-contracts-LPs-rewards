import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'hardhat-abi-exporter';
import { HardhatUserConfig } from 'hardhat/types';
require('hardhat-tracer');
require('@openzeppelin/hardhat-upgrades');

require('./tasks/index');
import * as dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url:
          'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
        blockNumber: 12472213, //  DO NOT CHANGE!
      },
    },
    rinkeby: {
      url: '',
      accounts: {
        mnemonic: '',
      },
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
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
    timeout: 40000,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS == 'false' ? false : true,
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
    spacing: 2,
  },
};
export default config;
