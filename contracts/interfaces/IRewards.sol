pragma solidity ^0.7.5;

interface IRewards {
  event NewClaim(uint256 _amount, address _token, address _to);
  event NewStake(uint256 _tokenID);
  event NewUnstake(uint256 _tokenID, address to);

  function stake(uint256 _id) external;

  function unstake(uint256 _id) external;

  function claim() external;

  /**
   * returns ids of user's staked nft positions
   */
  function staked() external view returns (uint256[] memory);

  /**
   * returns available ALPHR reward amount to claim at request time
   */
  function getClaimableAmount() external view returns (uint256);

  /**
   * Calculates rewards for all staked positions and
   * stores them in mapping
   * @dev because pool's tick average price is available
   * limited time, we need to save claimable amounts
   * before oracle times limits reached
   * @dev can be called only by owner
   */
  function rollUp() external;
}
