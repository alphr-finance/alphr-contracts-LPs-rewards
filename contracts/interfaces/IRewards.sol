pragma solidity ^0.7.5;

interface IRewards {
  event NewClaim(uint256 _amount, address _token, address _to);
  event NewStake(uint256 _tokenID);
  event NewUnstake(uint256 _tokenID, address to);

  function stake(uint256 _id) external returns (uint128);

  function unstake(uint256 _id) external payable;

  function claim() external;

  function getReward() external view;
}
