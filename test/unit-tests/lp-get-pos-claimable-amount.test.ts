/* eslint-disable jest/valid-expect */
//@ts-ignore
import { network, ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
} from '../../constants/uniswaps';
import { ALPHR_TOKEN } from './../../constants/tokens';
import {
  deployMockContract,
  MockContract,
} from '@ethereum-waffle/mock-contract';

const UNI = require('../../artifacts/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json');

describe.skip('LPs farming :: test suite get position claimable amount test suite { lp-get-pos-claimable-amount.test.ts }', () => {
  let deployer, uniswap, user: SignerWithAddress;
  let rewards: Rewards;
  let uniswapMock: MockContract;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, uniswap, user] = await ethers.getSigners();
  });

  before('deploy lp contract', async () => {
    uniswapMock = await deployMockContract(uniswap, UNI.abi);
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      uniswapMock.address,
      ALPHR_TOKEN,
      ALPHR_UNISWAP_V3_POOL
    )) as Rewards;
    await rewards.deployed();
    rewDeployTx = await rewards.deployTransaction.wait();
  });

  before('mock uniswap', async () => {
    await uniswapMock.mock.getApproved.returns(rewards.address);
    await uniswapMock.mock.transferFrom.returns();
  });

  it('contract deployed sucessfully', async () => {
    expect(rewDeployTx.status).eq(TX_RECEIPT_OK);
  });

  before('set new block reward to 100', async () => {
    await rewards
      .connect(deployer)
      .setBlockReward(ethers.utils.parseEther('5'));
  });

  it('stake', async () => {
    let tx = await rewards.connect(user).stake(50);
    let txr = await tx.wait();
    const expectedEventName =
      rewards.interface.events['NewStake(uint256,address)'].name;
    expect(txr.events[0].event).eq(expectedEventName);
  });

  it('mine 50 blocks', async () => {
    let blockNumber = await ethers.provider.getBlockNumber();
    for (let i = 0; i < 50; i++) {
      await deployer.sendTransaction({
        to: rewards.address,
        value: ethers.utils.parseEther('0'),
      });
    }
    let currentBlockNumber = await ethers.provider.getBlockNumber();
    expect(currentBlockNumber - blockNumber).to.be.eq(50);
  });

  it('get expected position claimable amount', async () => {
    expect(await rewards.connect(user).getClaimableAmount()).to.be.eq(
      ethers.utils.parseEther('12.5')
    );
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
