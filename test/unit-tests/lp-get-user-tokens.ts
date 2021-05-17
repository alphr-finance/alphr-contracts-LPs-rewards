/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { UNISWAP_V3_FACTORY } from '../../constants/uniswaps';
import {
  deployMockContract,
  MockContract,
} from '@ethereum-waffle/mock-contract';

const UNI = require('../../artifacts/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json');

describe('Lp get tokens test suite', () => {
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
      uniswapMock.address
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

  it('NewStake emited after stake', async () => {
    let tx = await rewards.connect(user).stake(1);
    let txr = await tx.wait();
    const expectedEventName =
      rewards.interface.events['NewStake(uint256)'].name;
    expect(txr.events[0].event).eq(expectedEventName);
  });

  it('returns array of 2 elements [1,2] after getUserTokens', async () => {
    await rewards.connect(user).stake(2);
    expect((await rewards.connect(user).getUserTokens()).toString()).eq('1,2');
    expect((await rewards.connect(user).getUserTokens()).length).eq(2);
  });

  it('returns empty array for getTokens', async () => {
    let tokens = await rewards.connect(deployer).getUserTokens();
    expect(tokens.toString()).eq('');
    expect(tokens.length).eq(0);
  });
});
