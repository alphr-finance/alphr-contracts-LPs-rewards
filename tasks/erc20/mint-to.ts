import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { task } from 'hardhat/config';
//import { IERC20 } from '../../typechain';

task('erc20mock:mintTo', 'erc20 mint token amount to recipient')
  .addParam('address', 'ERC20Mock contract address')
  .addParam('amount', 'token amount to mint')
  .addParam('to', 'recipient address')
  .setAction(async ({ address, amount, to }, hre) => {
    let recipient: SignerWithAddress;
    let token;
    recipient = await hre.ethers.getSigner(to);

    token = await hre.ethers.getContractAt('ERC20Mock', address);

    console.log(
      'Recipient token balance before mint:\t',
      (await token.balanceOf(recipient.address)).toString()
    );
    await token.mintTo(
      hre.ethers.utils.parseUnits(amount, await token.decimals()),
      recipient.address
    );
    console.log(
      'Recipient token balance after mint:\t',
      (await token.balanceOf(recipient.address)).toString()
    );
  });
