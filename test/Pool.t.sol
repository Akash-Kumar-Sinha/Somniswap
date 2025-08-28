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
    

    function setUp() public{
        user1 = address(0x1);
        user2 = address(0x2);

        usdt = new ERC20Mock("USDT", "USDT");
        stt = new ERC20Mock("STT", "STT");
        pooltoken = new AKSLPToken("Aks LP USDT-STT", "AKS-USDT-STT");
        pool = new Pool(address(usdt), address(stt), address(pooltoken));

        usdt.mint(user1, 1000);
        stt.mint(user1, 1000);
        usdt.mint(user2, 1_000);
        stt.mint(user2, 1_000);
    }

   function getSharesofUsers(address _user) public view{
        uint256 pooltokeSupply = pool.getPoolTokenSupply();
        console.log("pooltokeSupply: ", pooltokeSupply);
        uint256 user1share = pool.getPoolTokenShare(_user);
        console.log(_user, " share : ", user1share*100/pooltokeSupply);
    }

    function testAddLiquidity() public {
        vm.startPrank(user1);
        usdt.approve(address(pool), 500);
        stt.approve(address(pool), 500);
        pool.addLiquidity(uint256(500), uint256(500));
        getSharesofUsers(user1);
        vm.stopPrank();

        vm.startPrank(user2);
        usdt.approve(address(pool), 500);
        stt.approve(address(pool), 500);
        pool.addLiquidity(500, 500);
        getSharesofUsers(user1);
        getSharesofUsers(user2);
        vm.stopPrank();

        vm.startPrank(user1);
        usdt.approve(address(pool), 500);
        stt.approve(address(pool), 500);
        pool.addLiquidity(uint256(500), uint256(500));
        getSharesofUsers(user1);
        getSharesofUsers(user2);

        address user3 = makeAddr("user3");
        usdt.mint(user3, 1_000e18);
        vm.startPrank(user3);
        usdt.approve(address(pool), 300);
        uint256 amountOut = pool.swap(address(usdt), address(stt), uint256(300));
        console.log("stt amount out: ", amountOut);
        vm.stopPrank();

        vm.startPrank(user3);
        usdt.approve(address(pool), 300);
        amountOut = pool.swap(address(usdt), address(stt), uint256(300));
        console.log("stt amount out: ", amountOut);
        vm.stopPrank();

        getSharesofUsers(user1);
        getSharesofUsers(user2);

        (uint256 valusdt, uint256 valstt) = pool.getPoolReserves();
        console.log("the value of usdt is :", valusdt, "\n the val of stt is :", valstt);

        vm.stopPrank();
        
        vm.startPrank(user1);
        uint256 user1bal= usdt.balanceOf(user1);
        uint256 user1sttbal = stt.balanceOf(user1);
        console.log("user1:", user1);
        console.log("usdt bal of user1 is:", user1bal);
        console.log("stt bal of user1 is:", user1sttbal);

        uint256 tokenShare = pool.getPoolTokenShare(user1);
        pooltoken.approve(address(pool), tokenShare);
        pool.pullLiquidityAsLp();

        user1bal= usdt.balanceOf(user1);
        user1sttbal = stt.balanceOf(user1);
        console.log("user1:", user1);
        console.log("usdt bal of user1 is:", user1bal);
        console.log("stt bal of user1 is:", user1sttbal);
        vm.stopPrank();

        vm.startPrank(user2);
        user1bal= usdt.balanceOf(user2);
        user1sttbal = stt.balanceOf(user2);
        console.log("user2:", user2);
        console.log("usdt bal of user2 is:", user1bal);
        console.log("stt bal of user2 is:", user1sttbal);

        tokenShare = pool.getPoolTokenShare(user2);
        pooltoken.approve(address(pool), tokenShare);
        pool.pullLiquidityAsLp();

        user1bal= usdt.balanceOf(user2);
        user1sttbal = stt.balanceOf(user2);
        console.log("user2:", user2);
        console.log("usdt bal of user2 is:", user1bal);
        console.log("stt bal of user2 is:", user1sttbal);
        vm.stopPrank();
    }
    
}