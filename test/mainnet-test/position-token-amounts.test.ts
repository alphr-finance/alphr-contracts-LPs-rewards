//@ts-ignore
/* eslint-disable jest/valid-expect */

import { ethers, network } from 'hardhat';
import { Rewards } from '../../typechain';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';
import { expect } from 'chai';
import { ALPHR_TOKEN } from '../../constants/tokens';

describe('Position amounts :: test suite for ALPHR - WETH amount for positions', () => {
  let rewards: Rewards;
  before('deploy LPs rewards farming contract', async () => {
    rewards = await ethers
      .getContractFactory('Rewards')
      .then((factory) =>
        factory.deploy(
          UNISWAP_V3_FACTORY,
          UNISWAP_V3_NFT_POSITION_MANAGER,
          ALPHR_TOKEN,
          ALPHR_UNISWAP_V3_POOL
        )
      )
      .then((contract) => contract as Rewards);
  });

  // all alphr - weth nft positions IDs, prior to 12472213 block
  let alphrPositions = new Map();
  alphrPositions.set(13973, {
    alphr: '10143993179645099817412',
    weth: '15013334911932629734',
  });
  alphrPositions.set(14261, { alphr: '167558378533509477381', weth: '0' });
  alphrPositions.set(13251, {
    alphr: '6178755037148853128664',
    weth: '4280289379694190430',
  });
  alphrPositions.set(13239, {
    alphr: '10338089938661855628138',
    weth: '15286360810796286078',
  });
  alphrPositions.set(12800, {
    alphr: '9949803875176077344585',
    weth: '14725930433964448566',
  });
  alphrPositions.set(12524, {
    alphr: '13039908710616733286302',
    weth: '19299354132685443021',
  });
  alphrPositions.set(12154, {
    alphr: '14594152398293857417359',
    weth: '21599669265455501168',
  });
  alphrPositions.set(11652, {
    alphr: '14230347059772113088129',
    weth: '21061229294800171391',
  });
  alphrPositions.set(10863, {
    alphr: '13095407828175806520627',
    weth: '19381494057710534461',
  });
  alphrPositions.set(10803, {
    alphr: '1485859300695339096342',
    weth: '2199393644337417892',
  });
  it('has correct balances for each position', async () => {
    for (let [positionID, amounts] of alphrPositions) {
      const [a, w] = await rewards.getTokensAmountsFromPosition(positionID);
      expect(a).to.be.eq(amounts.alphr);
      expect(w).to.be.eq(amounts.weth);
      // console.log(
      //   'position id: %s\talphr: %s\tweth: %s',
      //   positionID,
      //   ethers.utils.formatUnits(a.toString(), 18),
      //   ethers.utils.formatUnits(w.toString(), 18)
      // );
    }
  });

  after('reset node fork', async () => {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl:
              'https://eth-mainnet.alchemyapi.io/v2/iHddcEw1BVe03s2BXSQx_r_BTDE-jDxB',
            blockNumber: 12472213,
          },
        },
      ],
    });
  });
});
