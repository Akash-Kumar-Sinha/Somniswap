// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Pool} from "../src/Pool.sol";
import {AKSLPToken} from "../src/PoolToken/AKSLPToken.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";
import {IAKSLPToken} from "../src/PoolToken/IAKSLPToken.sol";

contract PoolTest is Test {
    Pool pool;
    ERC20Mock public usdt;
    ERC20Mock public stt;
    IAKSLPToken public pooltoken;

    address public user1;
    address public user2;
    address public user3;

    function setUp() public {
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        usdt = new ERC20Mock("USDT", "USDT");
        stt = new ERC20Mock("STT", "STT");
        pooltoken = new AKSLPToken("Aks LP USDT-STT", "AKS-USDT-STT");

        pool = new Pool(address(usdt), address(stt), address(pooltoken));

        usdt.mint(user1, 1000e18);
        stt.mint(user1, 1000e18);

        usdt.mint(user2, 1000e18);
        stt.mint(user2, 1000e18);

        usdt.mint(user3, 1000e18);
        stt.mint(user3, 1000e18);
    }

    function _approveAll(address user) internal {
        vm.startPrank(user);
        usdt.approve(address(pool), type(uint256).max);
        stt.approve(address(pool), type(uint256).max);
        pooltoken.approve(address(pool), type(uint256).max);
        vm.stopPrank();
    }

    function testAddLiquidityInitial() public {
        _approveAll(user1);
        vm.startPrank(user1);

        pool.addLiquidity(100e18, 100e18);

        uint256 supply = pool.getPoolTokenSupply();
        uint256 userBal = pool.getPoolTokenShare(user1);

        assertGt(supply, 0, "LP supply should be > 0");
        assertEq(supply, userBal, "User1 should own 100% of LP tokens");

        (uint256 reserveA, uint256 reserveB) = pool.getPoolReserves();
        assertEq(reserveA, 100e18);
        assertEq(reserveB, 100e18);

        vm.stopPrank();
    }

    function testAddLiquiditySecondProvider() public {
        _approveAll(user1);
        _approveAll(user2);

        vm.startPrank(user1);
        pool.addLiquidity(200e18, 200e18);
        vm.stopPrank();

        vm.startPrank(user2);
        pool.addLiquidity(200e18, 200e18);
        vm.stopPrank();

        uint256 supply = pool.getPoolTokenSupply();
        uint256 user1Bal = pool.getPoolTokenShare(user1);
        uint256 user2Bal = pool.getPoolTokenShare(user2);

        assertEq(user1Bal, user2Bal, "Both users should hold equal shares");
        assertEq(user1Bal + user2Bal, supply, "Supply should equal sum of balances");
    }

    function testLiquidityQuote() public {
        _approveAll(user1);
        vm.startPrank(user1);
        pool.addLiquidity(100e18, 100e18);
        vm.stopPrank();

        uint256 quote = pool.liquidityQuote(50e18);
        assertEq(quote, 50e18, "Expected 1:1 ratio");
    }

    function testSwap() public {
        _approveAll(user1);
        _approveAll(user3);

        // Add liquidity
        vm.startPrank(user1);
        pool.addLiquidity(100e18, 100e18);
        vm.stopPrank();

        uint256 user3SttBefore = stt.balanceOf(user3);

        // Swap USDT → STT
        vm.startPrank(user3);
        uint256 outAmount = pool.swap(address(usdt), address(stt), 10e18);
        vm.stopPrank();

        uint256 user3SttAfter = stt.balanceOf(user3);

        assertGt(outAmount, 0, "Swap should return tokens");
        assertEq(user3SttAfter - user3SttBefore, outAmount, "STT received should equal amountOut");
    }

    function testSwapSequence() public {
        _approveAll(user1);
        _approveAll(user3);

        vm.startPrank(user1);
        // Check balances before first liquidity add
        console.log("Initial Balances:");
        console.log("User1 USDT:", usdt.balanceOf(user1));
        console.log("User1 STT:", stt.balanceOf(user1));
        console.log("User3 USDT:", usdt.balanceOf(user3));
        console.log("User3 STT:", stt.balanceOf(user3));

        pool.addLiquidity(100e18, 100e18);
        vm.stopPrank();

        (uint256 reserveA, uint256 reserveB) = pool.getPoolReserves();
        uint256 user1LP = pool.getPoolTokenShare(user1);
        console.log("\nAfter initial liquidity add:");
        console.log("ReserveA:", reserveA);
        console.log("ReserveB:", reserveB);
        console.log("User1 LP:", user1LP);

        vm.startPrank(user1);
        uint256 outAmount = pool.swap(address(usdt), address(stt), 50e18);
        vm.stopPrank();

        (reserveA, reserveB) = pool.getPoolReserves();
        uint256 user3STT = stt.balanceOf(user3);
        console.log("\nAfter swap:");
        console.log("ReserveA:", reserveA);
        console.log("ReserveB:", reserveB);
        console.log("STT received by user3:", outAmount);
        console.log("User3 STT balance:", user3STT);

        // Second liquidity add after swap
        // Use liquidityQuote to calculate the correct amount of the second token
        console.log("\nCheck balances before second liquidity add:");
        console.log("User1 USDT:", usdt.balanceOf(user1));
        console.log("User1 STT:", stt.balanceOf(user1));
        console.log("User3 USDT:", usdt.balanceOf(user3));
        console.log("User3 STT:", stt.balanceOf(user3));
        uint256 amountA = 1e18;
        uint256 amountB = pool.liquidityQuote(amountA);
        console.log("\nPreparing second liquidity add:");
        console.log("AmountA:", amountA);
        console.log("Calculated AmountB via liquidityQuote:", amountB);

        vm.startPrank(user1);
        console.log("\ncheck balance exist or not");
        console.log("User1 USDT:", usdt.balanceOf(user1));
        console.log("User1 STT:", stt.balanceOf(user1));
        console.log("User3 USDT:", usdt.balanceOf(user3));
        console.log("User3 STT:", stt.balanceOf(user3));
        console.log("\ngreater than");
        console.log("User1 USDT >= amountA:", usdt.balanceOf(user1) >= amountA);
        console.log("User1 STT >= amountB:", stt.balanceOf(user1) >= amountB);
        pool.addLiquidity(amountA, amountB);
        vm.stopPrank();

        (reserveA, reserveB) = pool.getPoolReserves();
        user1LP = pool.getPoolTokenShare(user1);
        uint256 totalSupply = pool.getPoolTokenSupply();
        console.log("\nAfter second liquidity add:");
        console.log("ReserveA:", reserveA);
        console.log("ReserveB:", reserveB);
        console.log("User1 LP:", user1LP);
        console.log("Total LP Supply:", totalSupply);
    }


    function testPullLiquidity() public {
        _approveAll(user1);

        vm.startPrank(user1);
        pool.addLiquidity(100e18, 100e18);

        uint256 lpBalance = pooltoken.balanceOf(user1);
        assertGt(lpBalance, 0, "User1 should have LP tokens");

        uint256 usdtBefore = usdt.balanceOf(user1);
        uint256 sttBefore = stt.balanceOf(user1);

        pool.pullLiquidityAsLp();

        uint256 usdtAfter = usdt.balanceOf(user1);
        uint256 sttAfter = stt.balanceOf(user1);

        assertGt(usdtAfter, usdtBefore, "User1 should get back USDT");
        assertGt(sttAfter, sttBefore, "User1 should get back STT");
        assertEq(pooltoken.balanceOf(user1), 0, "All LP tokens should be burned");

        vm.stopPrank();
    }

    function test_RevertWhen_AddLiquidityWithMismatchedAmounts() public {
        _approveAll(user1);

        vm.startPrank(user1);
        vm.expectRevert(); // you can also pass the revert string if you want stricter check
        pool.addLiquidity(100e18, 50e18);
        vm.stopPrank();
    }

    function testQuoteSwapViewFunction() public {
        _approveAll(user1);

        vm.startPrank(user1);
        pool.addLiquidity(100e18, 100e18);
        vm.stopPrank();

        uint256 quoted = pool.quoteSwap(address(usdt), 10e18);
        assertGt(quoted, 0, "Quote should return > 0");
    }
}
