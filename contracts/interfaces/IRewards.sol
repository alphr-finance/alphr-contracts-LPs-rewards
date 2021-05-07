pragma solidity 0.8.4;

interface IRewards {
    event NewClaim(uint256 amount, address token, address to);

    function stake(address _nftToken) external;

    function unstake(address _nftToken) external;

    function claim() external;

    function getReward() external view;

}
