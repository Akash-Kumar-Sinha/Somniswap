// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {PoolManager} from "../src/PoolManager.sol";
import {Pool} from "../src/Pool.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";
import {AKSLPToken} from "../src/PoolToken/AKSLPToken.sol";

import {TokenInfo} from "../src/Helper/IPoolManager.sol";

contract IntegratedPoolManagerTest is Test {
    PoolManager public poolManager;
    ERC20Mock public tokenA;
    ERC20Mock public tokenB;
    ERC20Mock public tokenC;
    ERC20Mock public tokenD;
    ERC20Mock public tokenE;
    
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public user3 = address(0x3);
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    
    event PoolCreated(address tokenA, address tokenB, address lpToken, address pool);
    
    function setUp() public {
        poolManager = new PoolManager();
        
        tokenA = new ERC20Mock("TOKENA", "A");
        tokenB = new ERC20Mock("TOKENB", "B");
        tokenC = new ERC20Mock("TOKENC", "C");
        tokenD = new ERC20Mock("TOKEND", "D");
        tokenE = new ERC20Mock("TOKENE", "E");
        
        _mintTokensToUsers();
    }
    
    function _mintTokensToUsers() internal {
        address[3] memory users = [user1, user2, user3];
        ERC20Mock[5] memory tokens = [tokenA, tokenB, tokenC, tokenD, tokenE];
        
        for (uint i = 0; i < users.length; i++) {
            for (uint j = 0; j < tokens.length; j++) {
                tokens[j].mint(users[i], INITIAL_SUPPLY);
            }
        }
    }
    
    function _approvePoolForUser(address user, address poolAddr) internal {
        Pool pool = Pool(poolAddr);
        (address poolTokenA, address poolTokenB) = pool.getPoolSwapToken();
        address lpTokenAddr = pool.getPoolTokenAddress();
        
        vm.startPrank(user);
        ERC20Mock(poolTokenA).approve(poolAddr, type(uint256).max);
        ERC20Mock(poolTokenB).approve(poolAddr, type(uint256).max);
        AKSLPToken(lpTokenAddr).approve(poolAddr, type(uint256).max);
        vm.stopPrank();
    }
    
    function testCreatePool() public {
        vm.expectEmit(true, true, false, false);
        emit PoolCreated(address(tokenA), address(tokenB), address(0), address(0));

        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );

        assertTrue(poolAddr != address(0), "Pool address should not be zero");
        assertEq(poolManager.getPoolByTokens(address(tokenA), address(tokenB)), poolAddr);
        assertEq(poolManager.getPoolByTokens(address(tokenB), address(tokenA)), poolAddr);
        assertEq(poolManager.allPoolsLength(), 1);
        
        console.log("Created pool address:", poolAddr);
    }
    
    function testCreateMultiplePools() public {
        address pool1 = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        address pool2 = poolManager.createPool(
            "Token C", "TKC", address(tokenC), "Token D", "TKD", address(tokenD)
        );
        address pool3 = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token C", "TKC", address(tokenC)
        );
        address pool4 = poolManager.createPool(
            "Token B", "TKB", address(tokenB), "Token E", "TKE", address(tokenE)
        );

        assertTrue(pool1 != pool2 && pool1 != pool3 && pool1 != pool4);
        assertTrue(pool2 != pool3 && pool2 != pool4);
        assertTrue(pool3 != pool4);
        
        assertEq(poolManager.allPoolsLength(), 4);
    }
    
    function testCreatePoolFailures() public {
        vm.expectRevert("Identical tokens");
        poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token A", "TKA", address(tokenA)
        );

        poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );

        vm.expectRevert("Pool already exists");
        poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );

        vm.expectRevert("Pool already exists");
        poolManager.createPool(
            "Token B", "TKB", address(tokenB), "Token A", "TKA", address(tokenA)
        );
    }
    
    function testPoolCreationAndBasicInfo() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);
        
        address lpTokenAddr = pool.getPoolTokenAddress();
        assertTrue(lpTokenAddr != address(0), "LP token address should not be zero");
        
        (address token0, address token1) = pool.getPoolSwapToken();
        assertTrue(
            (token0 == address(tokenA) && token1 == address(tokenB)) ||
            (token0 == address(tokenB) && token1 == address(tokenA)),
            "Pool should contain the correct tokens"
        );
        
        assertEq(pool.getPoolTokenSupply(), 0, "Initial LP supply should be zero");
        (uint256 reserveA, uint256 reserveB) = pool.getPoolReserves();
        assertEq(reserveA, 0, "Initial reserve A should be zero");
        assertEq(reserveB, 0, "Initial reserve B should be zero");
        
        console.log("Pool created successfully with LP token:", lpTokenAddr);
    }
    
    function testAddLiquidityToCreatedPool() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);
        
        _approvePoolForUser(user1, poolAddr);
        
        uint256 amountA = 1000 * 10**18;
        uint256 amountB = 1000 * 10**18;
        
        vm.startPrank(user1);
        pool.addLiquidity(amountA, amountB);
        vm.stopPrank();
        
        (uint256 reserveA, uint256 reserveB) = pool.getPoolReserves();
        assertTrue(reserveA == amountA || reserveA == amountB, "Reserve A should match input");
        assertTrue(reserveB == amountA || reserveB == amountB, "Reserve B should match input");
        
        uint256 lpBalance = pool.getPoolTokenShare(user1);
        assertTrue(lpBalance > 0, "User should have LP tokens");
        assertEq(pool.getPoolTokenSupply(), lpBalance, "Total supply should equal user balance");
        
        console.log("Liquidity added successfully. LP tokens:", lpBalance);
    }
    
    function testSwapInCreatedPool() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);
        
        (address poolTokenA, address poolTokenB) = pool.getPoolSwapToken();
        
        _approvePoolForUser(user1, poolAddr);
        _approvePoolForUser(user2, poolAddr);
        
        vm.startPrank(user1);
        pool.addLiquidity(1000 * 10**18, 1000 * 10**18);
        vm.stopPrank();
        
        uint256 swapAmount = 100 * 10**18;
        uint256 balanceABefore = ERC20Mock(poolTokenA).balanceOf(user2);
        uint256 balanceBBefore = ERC20Mock(poolTokenB).balanceOf(user2);
        
        vm.startPrank(user2);
        uint256 amountOut = pool.swap(poolTokenA, poolTokenB, swapAmount);
        vm.stopPrank();
        
        assertEq(ERC20Mock(poolTokenA).balanceOf(user2), balanceABefore - swapAmount);
        assertEq(ERC20Mock(poolTokenB).balanceOf(user2), balanceBBefore + amountOut);
        assertTrue(amountOut > 0, "Should receive output tokens");
        
        console.log("Swap successful. Amount out:", amountOut);
    }
    
    function testLiquidityRemovalFromCreatedPool() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);
        
        (address poolTokenA, address poolTokenB) = pool.getPoolSwapToken();
        
        _approvePoolForUser(user1, poolAddr);
        
        vm.startPrank(user1);
        pool.addLiquidity(1000 * 10**18, 1000 * 10**18);
        
        uint256 balanceABefore = ERC20Mock(poolTokenA).balanceOf(user1);
        uint256 balanceBBefore = ERC20Mock(poolTokenB).balanceOf(user1);
        uint256 lpTokens = pool.getPoolTokenShare(user1);
        
        console.log("LP tokens received:", lpTokens);
        console.log("Balance A before removal:", balanceABefore);
        console.log("Balance B before removal:", balanceBBefore);
        
        pool.pullLiquidityAsLp();
        vm.stopPrank();
        
        assertEq(pool.getPoolTokenShare(user1), 0, "LP tokens should be burned");
        assertEq(pool.getPoolTokenSupply(), 0, "Total supply should be zero");
        
        assertTrue(ERC20Mock(poolTokenA).balanceOf(user1) > balanceABefore, "Should receive tokenA back");
        assertTrue(ERC20Mock(poolTokenB).balanceOf(user1) > balanceBBefore, "Should receive tokenB back");
        
        console.log("Liquidity removed successfully");
    }
    
    function testMultiplePoolsWithDifferentOperations() public {
        address pool1Addr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        address pool2Addr = poolManager.createPool(
            "Token C", "TKC", address(tokenC), "Token D", "TKD", address(tokenD)
        );

        Pool pool1 = Pool(pool1Addr);
        Pool pool2 = Pool(pool2Addr);
        
        _approvePoolForUser(user1, pool1Addr);
        _approvePoolForUser(user1, pool2Addr);
        _approvePoolForUser(user2, pool1Addr);
        _approvePoolForUser(user2, pool2Addr);
        
        vm.startPrank(user1);
        pool1.addLiquidity(1000 * 10**18, 1000 * 10**18);
        pool2.addLiquidity(2000 * 10**18, 2000 * 10**18);
        vm.stopPrank();
        
        assertEq(pool1.getPoolTokenShare(user1), 1000 * 10**18);
        assertEq(pool2.getPoolTokenShare(user1), 2000 * 10**18);
        
        (address pool1TokenA, address pool1TokenB) = pool1.getPoolSwapToken();
        (address pool2TokenA, address pool2TokenB) = pool2.getPoolSwapToken();
        
        vm.startPrank(user2);
        uint256 out1 = pool1.swap(pool1TokenA, pool1TokenB, 100 * 10**18);
        uint256 out2 = pool2.swap(pool2TokenA, pool2TokenB, 200 * 10**18);
        vm.stopPrank();
        
        assertTrue(out1 > 0 && out2 > 0, "Both swaps should succeed");
        
        (uint256 reserve1A, uint256 reserve1B) = pool1.getPoolReserves();
        (uint256 reserve2A, uint256 reserve2B) = pool2.getPoolReserves();
        
        assertTrue(reserve1A != reserve2A || reserve1B != reserve2B, "Pools should have different reserves");
        
        console.log("Multiple pools operating independently");
    }
    
    function testPoolManagerAndPoolIntegrationWithFees() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);
        
        (address poolTokenA, address poolTokenB) = pool.getPoolSwapToken();
        
        _approvePoolForUser(user1, poolAddr);
        _approvePoolForUser(user2, poolAddr);
        
        vm.startPrank(user1);
        pool.addLiquidity(1000 * 10**18, 1000 * 10**18);
        vm.stopPrank();
        
        (uint256 initialReserveA, uint256 initialReserveB) = pool.getPoolReserves();
        
        vm.startPrank(user2);
        pool.swap(poolTokenA, poolTokenB, 50 * 10**18);
        pool.swap(poolTokenB, poolTokenA, 25 * 10**18);
        pool.swap(poolTokenA, poolTokenB, 30 * 10**18);
        vm.stopPrank();
        
        (uint256 finalReserveA, uint256 finalReserveB) = pool.getPoolReserves();
        uint256 totalReserves = finalReserveA + finalReserveB;
        uint256 initialTotal = initialReserveA + initialReserveB;
        
        assertTrue(totalReserves > initialTotal, "Reserves should grow due to fees");
        
        console.log("Fee accumulation verified in integrated pool");
    }
    
    function testPoolManagerWithMaxPools() public {
        address[] memory pools = new address[](10);
        
        pools[0] = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB));
        pools[1] = poolManager.createPool("Token A", "TKA", address(tokenA), "Token C", "TKC", address(tokenC));
        pools[2] = poolManager.createPool("Token A", "TKA", address(tokenA), "Token D", "TKD", address(tokenD));
        pools[3] = poolManager.createPool("Token B", "TKB", address(tokenB), "Token C", "TKC", address(tokenC));
        pools[4] = poolManager.createPool("Token B", "TKB", address(tokenB), "Token D", "TKD", address(tokenD));
        pools[5] = poolManager.createPool("Token C", "TKC", address(tokenC), "Token D", "TKD", address(tokenD));
        pools[6] = poolManager.createPool("Token A", "TKA", address(tokenA), "Token E", "TKE", address(tokenE));
        pools[7] = poolManager.createPool("Token B", "TKB", address(tokenB), "Token E", "TKE", address(tokenE));
        pools[8] = poolManager.createPool("Token C", "TKC", address(tokenC), "Token E", "TKE", address(tokenE));
        pools[9] = poolManager.createPool("Token D", "TKD", address(tokenD), "Token E", "TKE", address(tokenE));
        
        assertEq(poolManager.allPoolsLength(), 10);
        
        for (uint i = 0; i < pools.length; i++) {
            assertTrue(pools[i] != address(0));
            
            for (uint j = i + 1; j < pools.length; j++) {
                assertTrue(pools[i] != pools[j], "Pools should be unique");
            }
        }
        
        console.log("Successfully created and managed 10 pools");
    }
    
    function testCompleteWorkflow() public {
        console.log("=== Starting Complete Workflow Test ===");
        
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);
        console.log("Step 1: Pool created at", poolAddr);
        
        address lpTokenAddr = pool.getPoolTokenAddress();
        (address poolTokenA, address poolTokenB) = pool.getPoolSwapToken();
        console.log("Step 2: LP token at", lpTokenAddr);
        console.log("Pool uses tokenA:", poolTokenA, "tokenB:", poolTokenB);
        
        _approvePoolForUser(user1, poolAddr);
        _approvePoolForUser(user2, poolAddr);
        _approvePoolForUser(user3, poolAddr);
        
        vm.startPrank(user1);
        pool.addLiquidity(1000 * 10**18, 1000 * 10**18);
        vm.stopPrank();
        console.log("Step 3: Initial liquidity added by user1");
        
        vm.startPrank(user2);
        pool.addLiquidity(500 * 10**18, 500 * 10**18);
        vm.stopPrank();
        console.log("Step 4: Additional liquidity added by user2");
        
        vm.startPrank(user3);
        uint256 out1 = pool.swap(poolTokenA, poolTokenB, 100 * 10**18);
        uint256 out2 = pool.swap(poolTokenB, poolTokenA, 50 * 10**18);
        vm.stopPrank();
        console.log("Step 5: Swaps performed by user3. Outputs:", out1, out2);
        
        assertEq(poolManager.allPoolsLength(), 1);
        assertTrue(pool.getPoolTokenShare(user1) > pool.getPoolTokenShare(user2));
        assertEq(pool.getPoolTokenShare(user3), 0);
        assertTrue(pool.getPoolTokenSupply() > 0);
        
        vm.startPrank(user2);
        pool.pullLiquidityAsLp();
        vm.stopPrank();
        console.log("Step 6: User2 removed liquidity");
        
        console.log("=== Complete Workflow Test Passed ===");
    
    }

    function testSwapInvalidPairReverts() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);

        _approvePoolForUser(user1, poolAddr);
        vm.prank(user1);
        pool.addLiquidity(1000 ether, 1000 ether);

        vm.expectRevert("Invalid token pair");
        pool.swap(address(tokenC), address(tokenD), 100 ether);
    }

    function testPullLiquidityWithoutLPReverts() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);

        vm.expectRevert("This address is not a liquidity provider");
        vm.prank(user2);
        pool.pullLiquidityAsLp();
    }

    function testLiquidityQuoteWorks() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA),
            "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);

        _approvePoolForUser(user1, poolAddr);
        
        vm.startPrank(user1);
        pool.addLiquidity(1000 ether, 1000 ether);
        vm.stopPrank();

        uint256 quoted = pool.liquidityQuote(500 ether);
        assertEq(quoted, 500 ether, "Quote should maintain ratio");
    }


    function testQuoteSwapAndRevertCases() public {
        address poolAddr = poolManager.createPool(
            "Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB)
        );
        Pool pool = Pool(poolAddr);

        _approvePoolForUser(user1, poolAddr);
        vm.prank(user1);
        pool.addLiquidity(1000 ether, 1000 ether);

        uint256 out = pool.quoteSwap(address(tokenA), 100 ether);
        assertTrue(out > 0, "Quote swap should produce valid output");

        vm.expectRevert("Invalid token");
        pool.quoteSwap(address(tokenC), 100 ether);
    }

    function testGetPairedTokensAndAllTokens() public {
        poolManager.createPool("Token A", "TKA", address(tokenA), "Token B", "TKB", address(tokenB));
        poolManager.createPool("Token A", "TKA", address(tokenA), "Token C", "TKC", address(tokenC));

        TokenInfo[] memory paired = poolManager.getPairedTokenInfobyAddress(address(tokenA));
        assertEq(paired.length, 2, "Token A should be paired with 2 tokens");

        TokenInfo[] memory allTokens = poolManager.getAllTokens();
        assertTrue(allTokens.length >= 3, "Should track all unique tokens");
    }
  


    function testGetPoolAddressRevertsIfNotExist() public {
        vm.expectRevert("Pool does not exist");
        poolManager.getPoolAddress(address(tokenA), address(tokenC));
    }

}