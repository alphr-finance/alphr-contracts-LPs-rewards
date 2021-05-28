/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, upgrades, network, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { ALPHR_TOKEN } from '../../constants/tokens';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_NFT_POSITION_MANAGER,
} from '../../constants/uniswaps';

describe('LPs farming :: block rewards test suite { lp-block-rewards.test.ts }', () => {
  let deployer, user: SignerWithAddress;
  let rewards: Rewards;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
  });

  before('deploy LPs rewards contract', async () => {
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = await upgrades.deployProxy(Rewards, [
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_NFT_POSITION_MANAGER,
      ALPHR_TOKEN,
      ALPHR_UNISWAP_V3_POOL,
    ]);
    rewDeployTx = await rewards.deployTransaction.wait();
  });

  it('contract deployed sucessfully', async () => {
    expect(rewDeployTx.status).eq(TX_RECEIPT_OK);
  });

  it('get expected block reward', async () => {
    expect('0').to.be.eq((await rewards.getBlockALPHRReward()).toString());
  });

  it('set new block reward to 5 and check', async () => {
    await rewards.connect(deployer).setBlockALPHRReward(5);
    expect('5').to.be.eq((await rewards.getBlockALPHRReward()).toString());
  });

  it('try to set new block reward by non-owner and revert', async () => {
    await expect(
      rewards.connect(user).setBlockALPHRReward(10)
    ).to.be.revertedWith('revert Ownable: caller is not the owner');
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
