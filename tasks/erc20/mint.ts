import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { task } from 'hardhat/config';
import { IERC20 } from '../../typechain';

task('erc20mock:mint', 'erc20 mint token amount to msg sender')
  .addParam('address', 'ERC20Mock contract address')
  .addParam('amount', 'token amount to mint')
  .setAction(async ({ address, amount }, hre) => {
    let sender: SignerWithAddress;
    let token: IERC20;
    [sender] = await hre.ethers.getSigners();

    token = (await hre.ethers.getContractAt('ERC20Mock', address)) as IERC20;

    console.log(
      'Sender token balance before mint:\t',
      (await token.balanceOf(sender.address)).toString()
    );
    await token
      .connect(sender)
      .mint(hre.ethers.utils.parseUnits(amount, await token.decimals()));
    console.log(
      'Sender token balance after mint:\t',
      (await token.balanceOf(sender.address)).toString()
    );
  });
