pragma solidity ^0.7.5;

interface IRewards {
  event NewClaim(uint256 _amount, address _token, address _to);
  event NewStake(uint256 _tokenID);
  event NewUnstake(uint256 _tokenID, address to);

  function stake(uint256 _id) external;

  function unstake(uint256 _id) external;

  function claim() external;

  function getReward() external view;

  function setTotalAmountOfRewardsPerEpoch(uint256 amount) external;

  function getTotalAmountOfRewards() external view returns (uint256);
}
