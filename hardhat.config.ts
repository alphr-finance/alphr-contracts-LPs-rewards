require('@nomiclabs/hardhat-waffle');
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.4',
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
};
export default config;
