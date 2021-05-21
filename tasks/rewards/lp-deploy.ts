import { task } from 'hardhat/config';
import { LP_DEPLOY } from './lp-deploy-names';

export default task(LP_DEPLOY.NAME, LP_DEPLOY.DESC)
  .addParam(LP_DEPLOY.FACTORY_ADDRESS, LP_DEPLOY.FACTORY_ADDRESS_DESC)
  .addParam(LP_DEPLOY.NFT_MANAGER_ADDRESS, LP_DEPLOY.NFT_MANAGER_ADDRESS_DESC)
  .addParam(LP_DEPLOY.ALPHR_TOKEN_ADDRESS, LP_DEPLOY.ALPHR_TOKEN_ADDRESS_DESC)
  .setAction(
    async ({ fc, nft, alphr }, hre) =>
      await hre.ethers
        .getContractFactory(LP_DEPLOY.CONTRACT_NAME)
        .then((deployer) => deployer.deploy(fc, nft, alphr))
        .then((rewards) => rewards.deployed())
        .then((rewDeployed) =>
          console.log('Contracs Address:', rewDeployed.address)
        )
  );
