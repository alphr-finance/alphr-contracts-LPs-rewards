/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, network, providers } from 'hardhat';
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

describe('LPs farming :: get user staked positions test suite { lp-get-user-tokes.test.ts }', () => {
  let deployer, uniswap, user: SignerWithAddress;
  let rewards: Rewards;
  let uniswapMock: MockContract;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, uniswap, user] = await ethers.getSigners();
  });
  before('deploy lp contract', async () => {
    //TODO: delete after this values will be added into constants
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
    await uniswapMock.mock.positions.returns(
      0,
      user.address,
      user.address,
      user.address,
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

  it('contract deployed sucessfully', async () => {
    expect(rewDeployTx.status).eq(TX_RECEIPT_OK);
  });

  it.skip('NewStake emited after stake', async () => {
    let tx = await rewards.connect(user).stake(1);
    let txr = await tx.wait();
    const expectedEventName =
      rewards.interface.events['NewStake(uint256,address)'].name;
    expect(txr.events[0].event).eq(expectedEventName);
  });

  it.skip('returns array of 2 elements [1,2] from staked method', async () => {
    await rewards.connect(user).stake(2);
    expect((await rewards.connect(user).staked()).toString()).eq('1,2');
    expect((await rewards.connect(user).staked()).length).eq(2);
  });

  it('returns empty array for getTokens', async () => {
    let tokens = await rewards.connect(deployer).staked();
    expect(tokens.toString()).eq('');
    expect(tokens.length).eq(0);
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
