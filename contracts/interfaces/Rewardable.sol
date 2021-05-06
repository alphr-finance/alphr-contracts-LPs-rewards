pragma solidity >=0.7.0 <0.9.0;

/**
 *  @title interface to cover rewards for end users
 */
interface IRewards {
    /**
     *  Has to be emited in "claim/claimETH" function
     *  @param amount -- amount of deposit in ETH
     *  @param token -- address token the was sent
     *  @param to -- address where tokens were sent
     */
    event NewClaim(uint256 amount, address token, address to);

    /**
     *  Accept NFT token from uniswapV3
     *  and update reward share pool
     * @param _nftToken -- nft token address
     */
    function stake(address _nftToken) external;

    function ustake(address _nftToken) external;

    /**
     * Send reward of ALPHR token to user
     * @param _to -- address where tokens should be sent
     * @param _amount -- amount of tokens that should be sent
     * @dev event `NewClaim` has to be emitet
     */
    function claim(address _to, uint256 _amount) external payable;

    /**
     * Show reward of ALPHR token for user
     */
    function getReward() external view;

    /**
     *  Send reward of ETH  to user
     * @param _to -- address where tokens should be sent
     * @param _amount -- amount of tokens that should be sent
     * @dev event `NewClaim` has to be emitet
     */
    function claimETH(address _to, uint256 _amount) external payable;

    /**
     * Show reward of ETH for user
     */
    function getRewardETH() external view;

    /**
     * Update user share rewards in pool
     */
    function recalculate() external;
}
