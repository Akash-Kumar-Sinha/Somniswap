// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;


    struct TokenInfo {
        string name;
        string symbol;
        address tokenAddress;
    }
interface IPoolManager{
    function createPool(
        string memory tokenAName,
        string memory tokenASymbol,
        address tokenA,
        string memory tokenBName,
        string memory tokenBSymbol,
        address tokenB
    ) external returns(address poolAddr);
    event PoolCreated(address tokenA, address tokenB, address lpToken, address pool);

    function allPoolsLength() external view returns (uint256);
    function getAllTokens() external view returns (TokenInfo[] memory);
    function getPairedTokenInfobyAddress(address token) external view returns (TokenInfo[] memory);
    function getPoolAddress(address tokenA, address tokenB) external view returns (address);
}