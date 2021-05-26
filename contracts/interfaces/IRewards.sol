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

  /**
   * returns ids of user's staked nft positions
   */
  function staked() external view returns (uint256[] memory);
}
