require("@nomiclabs/hardhat-waffle");
import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  solidity: {
    version: '0.7.5',
    settings: {
      outputSelection: {
        "*": {
            "*": ["storageLayout"],
        },
      },
    }
  },
  mocha: {
    bail: true
  }
};
export default config;