import { LP_STAKE } from './lp-stake.names';
import { task } from 'hardhat/config';
import { UNISWAP_V3_NFT_POSITION_MANAGER } from './../../constants/uniswaps';

export default task(LP_STAKE.NAME, LP_STAKE.DESC)
  .addParam(LP_STAKE.FROM, LP_STAKE.FROM_DESC)
  .addParam(LP_STAKE.REWARDS_ADDRESS, LP_STAKE.REWARDS_ADDRESS_DESC)
  .addParam(LP_STAKE.TOKEN_ID, LP_STAKE.TOKEN_ID_DESC)
  .setAction(async ({ from, rew, tokenId }, hre) => {
    const nftManager = await hre.ethers.getContractAt(
      'INonfungiblePositionManager',
      UNISWAP_V3_NFT_POSITION_MANAGER
    );
    const signer = hre.ethers.provider.getSigner(from);
    await nftManager.connect(signer).approve(rew, tokenId);

    const rewContract = await hre.ethers.getContractAt(
      LP_STAKE.CONTRACT_NAME,
      rew
    );
    await rewContract.connect(signer).stake(tokenId);
    console.log('Token has been successfully stored');
  });
