import { task } from 'hardhat/config';

task('erc20mock:deploy', 'deploy erc20 mock contract')
  .addParam('name', 'ERC20 token name')
  .addParam('symbol', 'ERC20 token symbol')
  .addParam('decimals', 'ERC20 token decimals')
  .setAction(async ({ name, symbol, decimals }, hre) => {
    const address = await hre.ethers
      .getContractFactory('ERC20Mock')
      .then((deployer) => deployer.deploy(name, symbol, decimals))
      .then((token) => token.deployed())
      .then((rewDeployed) => {
        return rewDeployed.address;
      });
    return address;
  });
