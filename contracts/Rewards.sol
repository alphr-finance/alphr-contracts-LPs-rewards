pragma solidity ^0.7.5;
import "./interfaces/IRewards.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract Rewards is IRewards, Ownable {
    // factory represents uniswapV3Factory
    address private factory;

    // first address represents NFT token address
    // second address represents NonfungiblePositionManager contract's address
    // that corresponds to token
    mapping (address => address) tokenStorage;

    function stake(address _nftToken, uint256 _id) external override {
        require(tokenStorage[_nftToken] != address(0), "No token");

        address positionManager = tokenStorage[_nftToken];
        (uint96 nonce, 
        address operator,
        address token0,
        address token1, uint24 fee,int24 tickLower,int24 tickUpper,
        uint128 liquidity,
        uint256 feeGrowthInside0LastX128,
        uint256 feeGrowthInside1LastX128,
        uint128 tokensOwed0,
        uint128 tokensOwed1) = INonfungiblePositionManager(positionManager).positions(_id);
    }

    function unstake(address _nftToken) external override{}

    function claim() external override{}

    function getReward() external view override{}

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Empty address");
        factory = _factory;
    }

    function getFactory() public view returns(address) {
        return factory;
    }

    function collectToken(address _nftToken, address _positionManager) external onlyOwner {
        require(tokenStorage[_nftToken] == address(0), "Token already exists");
        require(_positionManager != address(0), "Position manager is empty");
        tokenStorage[_nftToken] = _positionManager;
    }
}