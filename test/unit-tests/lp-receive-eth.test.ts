/* eslint-disable jest/valid-expect */
//@ts-ignore
import { network, upgrades, ethers, providers } from 'hardhat';
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
import { utils } from 'ethers';

describe('Lp receive ETH test suite', () => {
  let deployer, user: SignerWithAddress;
  let rewards: Rewards;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, user] = await ethers.getSigners();
    console.log({ deployer });
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

  it('contract deployed successfully', async () => {
    expect(rewDeployTx.status).to.be.eq(TX_RECEIPT_OK);
  });

  it('send 100 ETH to rewards contract and check balance', async () => {
    await user.sendTransaction({
      to: rewards.address,
      value: utils.parseEther('100'),
    });
    const actual = await ethers.provider.getBalance(rewards.address);
    const expected = utils.parseEther('100');
    expect(actual).to.be.eq(expected);
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
