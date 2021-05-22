pragma solidity ^0.7.6;

interface IRewards {
  event NewClaim(
    uint256 indexed amount,
    address indexed positionId,
    address indexed from
  );

  event NewStake(uint256 indexed positionId, address indexed from);

  event NewUnstake(uint256 indexed positionId, address indexed from);

  function stake(uint256 _id) external;

  function unstake(uint256 _id) external;

  function claim() external;

  /**
   * returns ids of user's staked nft positions
   */
  function staked() external view returns (uint256[] memory);

  /**
   * Calculates rewards for all staked positions and
   * stores them in mapping
   * @dev because pool's tick average price is available
   * limited time, we need to save claimable amounts
   * before oracle times limits reached
   * @dev can be called only by owner
   */
  function rollUp() external;

  /**
   * returns available ALPHR reward amount to claim at request time
   */
  function getClaimableAmount() external view returns (uint256);
}
