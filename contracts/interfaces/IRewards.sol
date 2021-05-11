pragma solidity ^0.7.5;

interface IRewards {
    event NewClaim(uint256 _amount, address _token, address _to);
    event NewStake(uint256 _tokenID);

    function stake(uint256 _id) external payable returns (uint128);

    function unstake(address _nftToken) external;

    function claim() external;

    function getReward() external view;
}
