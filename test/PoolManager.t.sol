// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {PoolManager} from "../src/PoolManager.sol";
import {Pool} from "../src/Pool.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract PoolManagerTest is Test {
    PoolManager poolManager;
    ERC20Mock public tokenA;
    ERC20Mock public tokenB;
    ERC20Mock public tokenC;
    ERC20Mock public tokenD;
    
    function setUp() public {
        poolManager = new PoolManager();
        tokenA = new ERC20Mock("TOKENA", "A");
        tokenB = new ERC20Mock("TOKENB", "B");
        tokenC = new ERC20Mock("TOKENC", "C");
        tokenD = new ERC20Mock("TOKEND", "D");
    }
    
    function creatingPool(address first, address second) internal returns (address) {
        address poolCreated = poolManager.createPool(first, second);
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
        // Keep both address and Pool type variables
        address pool1 = creatingPool(address(tokenA), address(tokenB));
        Pool poolOne = Pool(pool1);
        address lpTokenAddress1 = poolOne.getPoolTokenAddress();
        console.log("LP Token address1: ", lpTokenAddress1);
        getPoolLength();
        
        address pool2 = creatingPool(address(tokenC), address(tokenD));
        Pool poolTwo = Pool(pool2);
        address lpTokenAddress2 = poolTwo.getPoolTokenAddress();
        console.log("LP Token address2: ", lpTokenAddress2);
        getPoolLength();
        
        address pool3 = creatingPool(address(tokenA), address(tokenC));
        Pool poolThree = Pool(pool3);
        address lpTokenAddress3 = poolThree.getPoolTokenAddress();
        console.log("LP Token address3: ", lpTokenAddress3);
        
        // You don't need vm.startPrank for just reading data
        // vm.startPrank is used for impersonating accounts for transactions
        
        address zero = gettPoolbyIndex(0);
        address one = gettPoolbyIndex(1);
        
        // Verify that the pools are correctly stored
        assertEq(zero, pool1, "Pool at index 0 should be pool1");
        assertEq(one, pool2, "Pool at index 1 should be pool2");
        
        // Verify LP token addresses are different
        assertTrue(lpTokenAddress1 != lpTokenAddress2, "LP token addresses should be different");
    }
}