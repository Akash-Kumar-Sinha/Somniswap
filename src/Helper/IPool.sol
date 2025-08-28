// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IPool{
    function addLiquidity(uint256 amountA, uint256 amountB) external;
    function pullLiquidityAsLp() external;
    function swap(address fromToken, address toToken, uint256 amountIn) external returns(uint256 amountOut);
    function getPoolTokenShare(address user) external view returns(uint256);
    function getPoolTokenSupply() external view returns(uint256);
    function getPoolReserves() external view returns(uint256 reserveA, uint256 reserveB);
    function getPoolTokenAddress() external view returns(address);
    function getPoolSwapToken() external view returns(address, address);

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 lpMinted);
    event LiquidityPulled(address indexed provider, uint256 lpBurned, uint256 amountA, uint256 amountB);
    event Swap(address indexed swapper, address fromToken, uint256 amountIn, address toToken, uint256 amountOut);

}