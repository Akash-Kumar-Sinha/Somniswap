// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Pool}  from "./Pool.sol";
import {AKSLPToken} from "./PoolToken/AKSLPToken.sol";
import {Helper} from "./Helper/Helper.sol";
import {IPoolManager, TokenInfo} from "./Helper/IPoolManager.sol";

contract PoolManager is IPoolManager {
    mapping(address => mapping(address => address)) public getPoolByTokens;
    mapping(address => address[2]) public getTokensByPool;



    TokenInfo[] public allTokens;
    mapping(address => TokenInfo) public getTokenInfo;
    address[] public allPools;


    function createPool(
        string memory tokenAName,
        string memory tokenASymbol,
        address tokenA,
        string memory tokenBName,
        string memory tokenBSymbol,
        address tokenB
    ) external returns (address poolAddr) {
        require(tokenA != tokenB, "Identical tokens");
        require(getPoolByTokens[tokenA][tokenB] == address(0), "Pool already exists");

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

        getPoolByTokens[tokenA][tokenB] = poolAddr;
        getPoolByTokens[tokenB][tokenA] = poolAddr;
        getTokensByPool[poolAddr] = [tokenA, tokenB];

        if (getTokenInfo[tokenA].tokenAddress == address(0)) {
            getTokenInfo[tokenA] = TokenInfo(tokenAName, tokenASymbol, tokenA);
            allTokens.push(getTokenInfo[tokenA]);
        }
        if (getTokenInfo[tokenB].tokenAddress == address(0)) {
            getTokenInfo[tokenB] = TokenInfo(tokenBName, tokenBSymbol, tokenB);
            allTokens.push(getTokenInfo[tokenB]);
        }

        allPools.push(poolAddr);

        emit PoolCreated(tokenA, tokenB, lpToken, poolAddr);
    }

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    function getAllTokens() external view returns (TokenInfo[] memory) {
        return allTokens;
    }

    function getPairedTokenInfobyAddress(address token) external view returns (TokenInfo[] memory) {
        uint256 total = allPools.length;
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            address[2] memory pair = getTokensByPool[allPools[i]];
            if (pair[0] == token || pair[1] == token) {
                count++;
            }
        }

        TokenInfo[] memory paired = new TokenInfo[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < total; i++) {
            address[2] memory pair = getTokensByPool[allPools[i]];
            if (pair[0] == token) {
                paired[j] = getTokenInfo[pair[1]];
                j++;
            } else if (pair[1] == token) {
                paired[j] = getTokenInfo[pair[0]];
                j++;
            }
        }

        return paired;
    }

    function getPoolAddress(address tokenA, address tokenB) external view returns (address) {
        require(tokenA != tokenB, "Identical tokens");
        address pool = getPoolByTokens[tokenA][tokenB];
        require(pool != address(0), "Pool does not exist");
        return pool;
    }

}
