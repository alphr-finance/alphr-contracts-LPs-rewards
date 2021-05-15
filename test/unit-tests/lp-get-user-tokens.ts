//@ts-ignore
import { ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
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
    const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
    const Rewards = await ethers.getContractFactory('Rewards');
    rewards = (await Rewards.connect(deployer).deploy(
      UNISWAP_V3_FACTORY,
      uniswapMock.address
    )) as Rewards;
    await rewards.deployed();
    rewDeployTx = await rewards.deployTransaction.wait();
  });

  it('lp OK deploy', async () => {
    expect(rewDeployTx.status).eq(1);
  });

  it('stake tokens', async () => {
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
    let tx = await rewards.connect(user).stake(666);
    let txr = await tx.wait();
    const expectedEventName =
      rewards.interface.events['NewStake(uint256)'].name;
    expect(txr.events[0].event).eq(expectedEventName);
  });

  it('get user tokens', async () => {
    await rewards.connect(user).stake(777);
    expect((await rewards.connect(user).getUserTokens()).toString()).eq(
      '666,777'
    );
    expect((await rewards.connect(user).getUserTokens()).length).eq(2);
  });

  it('get user tokens while empty', async () => {
    expect((await rewards.connect(deployer).getUserTokens()).toString()).eq('');
    expect((await rewards.connect(deployer).getUserTokens()).length).eq(0);
  });
});
