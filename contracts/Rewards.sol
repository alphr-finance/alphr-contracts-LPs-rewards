pragma solidity ^0.7.5;
import "./interfaces/IRewards.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Rewards is IRewards, Ownable {
    // factory represents uniswapV3Factory
    address private factory;

    // nft manager
    address private nftManager;

    constructor(address _factory, address _nftManager) public {
        factory = _factory;
        nftManager = _nftManager;
    }

    function stake(uint256 _id) external payable override returns(uint128) {
        require(IERC721(nftManager).getApproved(_id) == address(this), "Token should be approved before stake");

       IERC721(nftManager).transferFrom(msg.sender, address(this), _id);
        emit NewStake(_id);
        (uint96 nonce, 
        address operator,
        address token0,
        address token1, uint24 fee,int24 tickLower,int24 tickUpper,
        uint128 _liquidity,
        uint256 feeGrowthInside0LastX128,
        uint256 feeGrowthInside1LastX128,
        uint128 tokensOwed0,
        uint128 tokensOwed1) = INonfungiblePositionManager(nftManager).positions(_id);

        // TO DO
        // 1) Store user as reward earner
        // 2) Freeze already earned reward for user
        // 3) recalculate reward for all users
 
        return _liquidity;
    }

    function unstake(address _nftToken) external override {
        revert("Not implemented");
    }

    function claim() external override {
        revert("Not implemented");
    }

    function getReward() external view override {
        revert("Not implemented");
    }

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Empty address");
        factory = _factory;
    }

    function getFactory() public view returns(address) {
        return factory;
    }
}