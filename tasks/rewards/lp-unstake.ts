import { LP_UNSTAKE } from './lp-unstake.names';
import { task } from 'hardhat/config';

export default task(LP_UNSTAKE.NAME, LP_UNSTAKE.DESC)
  .addParam(LP_UNSTAKE.FROM, LP_UNSTAKE.FROM_DESC)
  .addParam(LP_UNSTAKE.REWARDS_ADDRESS, LP_UNSTAKE.REWARDS_ADDRESS_DESC)
  .addParam(LP_UNSTAKE.TOKEN_ID, LP_UNSTAKE.TOKEN_ID_DESC)
  .setAction(async ({ from, rew, tokenId }, hre) => {
    const signer = hre.ethers.provider.getSigner(from);
    const rewContract = await hre.ethers.getContractAt(
      LP_UNSTAKE.CONTRACT_NAME,
      rew
    );
    await rewContract.connect(signer).unstake(tokenId);
    console.log(
      'Token with tokentID',
      tokenId,
      'has been successfully unstaked'
    );
  });
