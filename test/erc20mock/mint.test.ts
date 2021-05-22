/* eslint-disable jest/valid-expect */
//@ts-ignore
import { ethers, network, providers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TX_RECEIPT_OK } from '../../constants/tx-status';

describe('ERC20Mock :: mint test suite { mint.test.ts }', () => {
  let deployer, recipient1, recipient2: SignerWithAddress;
  let token;
  let tokenDeployTx: providers.TransactionReceipt;

  before('init signers', async () => {
    [deployer, recipient1, recipient2] = await ethers.getSigners();
  });

  before('deploy ERC20Mock contract', async () => {
    const erc20Mock = await ethers.getContractFactory('ERC20Mock');
    token = await erc20Mock.connect(deployer).deploy('MockToken', 'MT', 18);
    await token.deployed();
    tokenDeployTx = await token.deployTransaction.wait();
  });

  it('contract deployed sucessfully', async () => {
    expect(tokenDeployTx.status).eq(TX_RECEIPT_OK);
  });

  it('mint() 100 tokens and check balance', async () => {
    await token
      .connect(recipient1)
      .mint(ethers.utils.parseUnits('100', await token.decimals()));
    expect(await token.balanceOf(recipient1.address)).to.be.eq(
      ethers.utils.parseUnits('100', await token.decimals())
    );
  });

  it('mintTo() 100 tokens and check balance', async () => {
    await token.mintTo(
      ethers.utils.parseUnits('100', await token.decimals()),
      recipient2.address
    );
    expect(await token.balanceOf(recipient2.address)).to.be.eq(
      ethers.utils.parseUnits('100', await token.decimals())
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
