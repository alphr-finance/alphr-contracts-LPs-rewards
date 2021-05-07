pragma solidity >=0.7.0 <0.9.0;

interface IRewards {
    event NewClaim(uint256 amount, address token, address to);

    function stake(address _nftToken) external;

    function ustake(address _nftToken) external;

    function claim(address _to, uint256 _amount) external payable;

    function getReward() external view;

    function claimETH(address _to, uint256 _amount) external payable;

    function getRewardETH() external view;

    function recalculate() external;
}
