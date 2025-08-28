// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IPoolManager{
    function createPool(address tokenA, address tokenB) external returns(address poolAddr);
    event PoolCreated(address tokenA, address tokenB, address lpToken, address pool);

    function allPoolsLength() external view returns (uint256);
    function getPoolByIndex(uint256 index) external view returns (address);

}