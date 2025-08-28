// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Pool}  from "./Pool.sol";
import {AKSLPToken} from "./PoolToken/AKSLPToken.sol";
import {Helper} from "./Helper/Helper.sol";
import {IPoolManager} from "./Helper/IPoolManager.sol";

contract PoolManager is IPoolManager {
    mapping(address => mapping(address => address)) public getPool;
    address[] public allPools;

    function createPool(
        address tokenA,
        address tokenB
    ) external returns (address poolAddr) {
        require(tokenA != tokenB, "Identical tokens");
        require(getPool[tokenA][tokenB] == address(0), "Pool already exists");

        string memory name = string(
            abi.encodePacked("Aks LP ", Helper._shortAddr(tokenA), "-", Helper._shortAddr(tokenB))
        );
        string memory symbol = string(
            abi.encodePacked("AKS-", Helper._shortAddr(tokenA), "-", Helper._shortAddr(tokenB))
        );

        AKSLPToken lp = new AKSLPToken(name, symbol);
        address lpToken = address(lp);

        Pool pool = new Pool(tokenA, tokenB, lpToken);
        poolAddr = address(pool);

        getPool[tokenA][tokenB] = poolAddr;
        getPool[tokenB][tokenA] = poolAddr;

        allPools.push(poolAddr);

        emit PoolCreated(tokenA, tokenB, lpToken, poolAddr);
    }

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    function getPoolByIndex(uint256 index) external view returns (address) {
        require(index < allPools.length, "Index out of bounds");
        return allPools[index];
    }
}
