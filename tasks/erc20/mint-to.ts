import { task } from 'hardhat/config';
import { ethers } from 'ethers';

task('erc20mock:mintTo', 'erc20 mint token amount to recipient')
  .addParam('address', 'ERC20Mock contract address')
  .addParam('amount', 'token amount to mint')
  .addParam('to', 'recipient address')
  .setAction(async ({ address, amount, to }, hre) => {
    const token = await hre.ethers.getContractAt('ERC20Mock', address);

    const decimals = await token.decimals();
    const symbol = await token.symbol();

    await token
      .balanceOf(to)
      .then((balance) =>
        console.log(
          '%s balance before mint:\t%s %s',
          to,
          ethers.utils.formatUnits(balance, decimals),
          symbol
        )
      );

    await token
      .mintTo(hre.ethers.utils.parseUnits(amount, await token.decimals()), to)
      .then((tx) => tx.wait());

    await token
      .balanceOf(to)
      .then((balance) =>
        console.log(
          '%s balance after mint:\t%s %s',
          to,
          ethers.utils.formatUnits(balance, decimals),
          symbol
        )
      );
  });
