/* eslint-disable jest/valid-expect */
//@ts-ignore
import { network, ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { ALPHR_TOKEN } from '../../constants/tokens';
import { UNISWAP_V3_FACTORY } from '../../constants/uniswaps';
import {
  deployMockContract,
  MockContract,
} from '@ethereum-waffle/mock-contract';
import { utils } from 'ethers';

const UNI = require('../../artifacts/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json');

describe('Lp receive ETH test suite', () => {
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
      ALPHR_TOKEN
    )) as Rewards;
    await rewards.deployed();
    rewDeployTx = await rewards.deployTransaction.wait();
  });

  it('contract deployed sucessfully', async () => {
    expect(rewDeployTx.status).eq(TX_RECEIPT_OK);
  });

  it('send 100 ETH to rewards contract and check balance', async () => {
    await user.sendTransaction({
      to: rewards.address,
      value: utils.parseEther('100'),
    });
    expect(await ethers.provider.getBalance(rewards.address)).eq(
      utils.parseEther('100')
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
            blockNumber: 12419631,
          },
        },
      ],
    });
  });
});
