// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {PoolManager} from "../src/PoolManager.sol";
import {Pool} from "../src/Pool.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

import {TokenInfo} from "../src/Helper/IPoolManager.sol";

contract PoolManagerTest is Test {
    PoolManager poolManager;

    ERC20Mock public tokenA;
    ERC20Mock public tokenB;
    ERC20Mock public tokenC;
    ERC20Mock public tokenD;

    string public tokenAName = "Token A";
    string public tokenASymbol = "TKA";
    string public tokenBName = "Token B";
    string public tokenBSymbol = "TKB";
    string public tokenCName = "Token C";
    string public tokenCSymbol = "TKC";
    string public tokenDName = "Token D";
    string public tokenDSymbol = "TKD";

    function setUp() public {
        poolManager = new PoolManager();
        tokenA = new ERC20Mock(tokenAName, tokenASymbol);
        tokenB = new ERC20Mock(tokenBName, tokenBSymbol);
        tokenC = new ERC20Mock(tokenCName, tokenCSymbol);
        tokenD = new ERC20Mock(tokenDName, tokenDSymbol);
    }

    function _createPool(
        string memory nameA,
        string memory symbolA,
        address first,
        string memory nameB,
        string memory symbolB,
        address second
    ) internal returns (address) {
        return poolManager.createPool(nameA, symbolA, first, nameB, symbolB, second);
    }

    function test_CreateMultiplePools() public {
        address pool1 = _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenBName, tokenBSymbol, address(tokenB)
        );
        Pool poolOne = Pool(pool1);
        address lp1 = poolOne.getPoolTokenAddress();

        address pool2 = _createPool(
            tokenCName, tokenCSymbol, address(tokenC),
            tokenDName, tokenDSymbol, address(tokenD)
        );
        Pool poolTwo = Pool(pool2);
        address lp2 = poolTwo.getPoolTokenAddress();

        address pool3 = _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenCName, tokenCSymbol, address(tokenC)
        );
        Pool poolThree = Pool(pool3);
        address lp3 = poolThree.getPoolTokenAddress();

        assertTrue(lp1 != lp2 && lp2 != lp3, "Each pool should have a unique LP token");
        assertEq(poolManager.allPoolsLength(), 3, "Should have 3 pools created");
    }

    function test_RevertWhen_CreatingPoolWithIdenticalTokens() public {
        vm.expectRevert("Identical tokens");
        _createPool(tokenAName, tokenASymbol, address(tokenA), tokenAName, tokenASymbol, address(tokenA));
    }

    function test_RevertWhen_CreatingDuplicatePool() public {
        _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenBName, tokenBSymbol, address(tokenB)
        );

        vm.expectRevert("Pool already exists");
        _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenBName, tokenBSymbol, address(tokenB)
        );
    }

    function test_GetPoolAddressWorks() public {
        address poolAddr = _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenBName, tokenBSymbol, address(tokenB)
        );

        address fetched = poolManager.getPoolAddress(address(tokenA), address(tokenB));
        assertEq(fetched, poolAddr, "Pool address should match");

        // Reverse order should also work
        address fetchedReverse = poolManager.getPoolAddress(address(tokenB), address(tokenA));
        assertEq(fetchedReverse, poolAddr, "Pool address should match regardless of token order");
    }

    function test_GetAllTokens() public {
        _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenBName, tokenBSymbol, address(tokenB)
        );

        TokenInfo[] memory tokens = poolManager.getAllTokens();
        assertEq(tokens.length, 2, "Two tokens should be registered");
        assertEq(tokens[0].symbol, tokenASymbol);
        assertEq(tokens[1].symbol, tokenBSymbol);
    }

    function test_GetPairedTokens() public {
        _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenBName, tokenBSymbol, address(tokenB)
        );
        _createPool(
            tokenAName, tokenASymbol, address(tokenA),
            tokenCName, tokenCSymbol, address(tokenC)
        );

        TokenInfo[] memory pairs = poolManager.getPairedTokenInfobyAddress(address(tokenA));
        assertEq(pairs.length, 2, "Token A should have 2 pairs");

        // Ensure one of the pairs is Token B
        bool foundB = false;
        for (uint256 i = 0; i < pairs.length; i++) {
            if (keccak256(bytes(pairs[i].symbol)) == keccak256(bytes(tokenBSymbol))) {
                foundB = true;
            }
        }
        assertTrue(foundB, "Token B should appear as pair for Token A");
    }
}
