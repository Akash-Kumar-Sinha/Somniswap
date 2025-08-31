// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {PoolManager} from "../src/PoolManager.sol";
import {Pool} from "../src/Pool.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract PoolManagerTest is Test {
    PoolManager poolManager;
    ERC20Mock public tokenA;
    string public tokenAName;
    string public tokenASymbol;
    ERC20Mock public tokenB;
    string public tokenBName;
    string public tokenBSymbol;
    ERC20Mock public tokenC;
    string public tokenCName;
    string public tokenCSymbol;
    ERC20Mock public tokenD;
    string public tokenDName;
    string public tokenDSymbol;

    function setUp() public {
        poolManager = new PoolManager();
        tokenAName = "Token A";
        tokenASymbol = "TKA";
        tokenA = new ERC20Mock(tokenAName, tokenASymbol);
        tokenBName = "Token B";
        tokenBSymbol = "TKB";
        tokenB = new ERC20Mock(tokenBName, tokenBSymbol);
        tokenCName = "Token C";
        tokenCSymbol = "TKC";
        tokenC = new ERC20Mock(tokenCName, tokenCSymbol);
        tokenDName = "Token D";
        tokenDSymbol = "TKD";
        tokenD = new ERC20Mock(tokenDName, tokenDSymbol);
    }

    function creatingPool(string memory nameA, string memory symbolA, address first, string memory nameB, string memory symbolB, address second) internal returns (address) {
        address poolCreated = poolManager.createPool(
            nameA, symbolA, first, nameB, symbolB, second
        );
        console.log("The address of the new pool is: ", poolCreated);
        return poolCreated;
    }
    
    function getPoolLength() internal view returns (uint256) {
        uint256 leng = poolManager.allPoolsLength();
        console.log("The current number of pools is: ", leng);
        return leng;
    }
    
    function gettPoolbyIndex(uint256 value) internal view returns (address) {
        address poolAddr = poolManager.getPoolByIndex(value);
        console.log("The address of the pool at index ", value, " is: ", poolAddr);
        return poolAddr;
    }
    
    function getLpTokenAddress(address poolAddress) internal view returns (address) {
        address lpToken = Pool(poolAddress).getPoolTokenAddress();
        console.log("LP Token address for pool ", poolAddress, " is: ", lpToken);
        return lpToken;
    }
    
    function testCreatePool() public {
        address pool1 = creatingPool(
            tokenAName, tokenASymbol, address(tokenA), tokenBName, tokenBSymbol, address(tokenB)
        );
        Pool poolOne = Pool(pool1);
        address lpTokenAddress1 = poolOne.getPoolTokenAddress();
        console.log("LP Token address1: ", lpTokenAddress1);
        getPoolLength();
        
        address pool2 = creatingPool(
            tokenCName, tokenCSymbol, address(tokenC), tokenDName, tokenDSymbol, address(tokenD)
        );
        Pool poolTwo = Pool(pool2);
        address lpTokenAddress2 = poolTwo.getPoolTokenAddress();
        console.log("LP Token address2: ", lpTokenAddress2);
        getPoolLength();
        
        address pool3 = creatingPool(
            tokenAName, tokenASymbol, address(tokenA), tokenCName, tokenCSymbol, address(tokenC)
        );
        Pool poolThree = Pool(pool3);
        address lpTokenAddress3 = poolThree.getPoolTokenAddress();
        console.log("LP Token address3: ", lpTokenAddress3);
        
        
        address zero = gettPoolbyIndex(0);
        address one = gettPoolbyIndex(1);
        
        assertEq(zero, pool1, "Pool at index 0 should be pool1");
        assertEq(one, pool2, "Pool at index 1 should be pool2");
        
        assertTrue(lpTokenAddress1 != lpTokenAddress2, "LP token addresses should be different");
    }
}