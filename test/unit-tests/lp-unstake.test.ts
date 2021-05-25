/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, network, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import {
  ALPHR_UNISWAP_V3_POOL,
  UNISWAP_V3_FACTORY,
} from '../../constants/uniswaps';
import {
  deployMockContract,
  MockContract,
} from '@ethereum-waffle/mock-contract';
import * as uniswapNftPosistionManager from '../../artifacts/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json';
import { ALPHR_TOKEN } from '../../constants/tokens';

describe('LPs Rewards ::  unstake method test suite', () => {
  let deployer, uniswap, user, other: SignerWithAddress;

  before('init signers', async () => {
    [deployer, uniswap, user, other] = await ethers.getSigners();
  });

  let uniswapMock: MockContract;
  before('deploy uniswap mock contract', async () => {
    uniswapMock = await deployMockContract(
      uniswap,
      uniswapNftPosistionManager.abi
    );
  });

  let rewards: Rewards;
  let rewDeployTx: providers.TransactionReceipt;
  before('deploy lp rewards contract', async () => {
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

  it('has correct receipt status of rewards contract deploy', async () => {
    expect(rewDeployTx.status).to.eq(TX_RECEIPT_OK);
  });

  before('mock uniswap', async () => {
    // https://docs.uniswap.org/reference/periphery/NonfungiblePositionManager#positions
    await uniswapMock.mock.positions.returns(
      0,
      user.address, // operator
      '0xaa99199d1e9644b588796f3215089878440d58e0', // ALPHR
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    );
    await uniswapMock.mock.getApproved.returns(rewards.address);
    await uniswapMock.mock.transferFrom.returns();
  });

  it('reverts unstake tx if user does not have staked tokens', async () => {
    await expect(rewards.connect(user).unstake('1')).to.be.revertedWith(
      'Token is not staked'
    );
  });

  it.skip('reverts unstake tx if token is not owned by user', async () => {
    await rewards.connect(other).stake('2');
    await expect(rewards.connect(user).unstake('2')).to.be.revertedWith(
      'User must own this token'
    );
  });

  it.skip('emits correct event in unstake tx', async () => {
    await rewards.connect(user).stake('1');
    const tx = await rewards.connect(user).unstake('1');
    const txr = await tx.wait();
    const expectedEventName =
      rewards.interface.events['NewUnstake(uint256,address)'].name;
    expect(txr.events[0].event).eq(expectedEventName);
  });

  it('returns length 0 and empty array after unstake', async () => {
    let tokens = await rewards.connect(user).staked();
    expect(tokens.length).eq(0);
    expect(tokens.toString()).eq('');
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
