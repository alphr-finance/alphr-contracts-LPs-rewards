/* eslint-disable jest/valid-expect */
//@ts-ignore
import { network, ethers, providers } from 'hardhat';
import { expect } from 'chai';
import { Rewards } from '../../typechain/Rewards';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';
import { ALPHR_TOKEN } from '../../constants/tokens';
import { UNISWAP_V3_FACTORY } from '../../constants/uniswaps';
import { IERC20 } from '../../typechain/IERC20';
import {
  deployMockContract,
  MockContract,
} from '@ethereum-waffle/mock-contract';
import { utils } from 'ethers';

const UNI = require('../../artifacts/@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json');

const alphrDecimals = 18;
const alphrHolderAddress = '0xd266d61ac22c2a2ac2dd832e79c14ea152c998d6';

describe('Lp receive ALPHR test suite', () => {
  let deployer, uniswap: SignerWithAddress;
  let rewards: Rewards;
  let uniswapMock: MockContract;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, uniswap] = await ethers.getSigners();
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

  it('send 100 ALPHR to rewards contract and check balance', async () => {
    let alphr = (await ethers.getContractAt('IERC20', ALPHR_TOKEN)) as IERC20;

    await network.provider.send('hardhat_impersonateAccount', [
      alphrHolderAddress,
    ]);
    const alphrHolder = await ethers.provider.getSigner(alphrHolderAddress);

    // send eth to pay tx
    await deployer.sendTransaction({
      to: alphrHolderAddress,
      value: utils.parseEther('100'),
    });

    await alphr
      .connect(alphrHolder)
      .transfer(rewards.address, utils.parseUnits('100', alphrDecimals));

    expect(await alphr.balanceOf(rewards.address)).to.be.eq(
      utils.parseUnits('100', alphrDecimals)
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
