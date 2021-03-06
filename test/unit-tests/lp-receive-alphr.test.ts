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
import { IERC20 } from '../../typechain/IERC20';
import { utils } from 'ethers';

const alphrDecimals = 18;
const alphrHolderAddress = '0xd266d61ac22c2a2ac2dd832e79c14ea152c998d6';

describe('Lp receive ALPHR test suite', () => {
  let deployer: SignerWithAddress;
  let rewards: Rewards;
  let rewDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer] = await ethers.getSigners();
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
            blockNumber: 12472213,
          },
        },
      ],
    });
  });
});
