//@ts-ignore
/* eslint-disable jest/valid-expect */

import { network } from 'hardhat';

export async function ResetToBlock(block) {
  await network.provider.send('evm_setAutomine', [true]);
  await network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl:
            'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
          blockNumber: block,
        },
      },
    ],
  });
}
