// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {TokenLauncher, ERC20WithMint} from "../src/Tokens/TokenLauncher.sol";

contract TokenLauncherTest is Test {
    TokenLauncher launcher;
    address public user1;
    address public user2;

    function setUp() public {
        launcher = new TokenLauncher();
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
    }

    function testLaunchToken() public {
        vm.startPrank(user1);
        string memory name = "MyToken";
        string memory symbol = "MTK";
        uint256 initialSupply = 1000;

        address tokenAddress = launcher.launchToken(name, symbol, initialSupply);

        console.log("Token address:", uint160(tokenAddress));
        console.log("Owner address:", uint160(user1));

        ERC20WithMint token = ERC20WithMint(tokenAddress);
        assertEq(token.name(), name);
        assertEq(token.symbol(), symbol);

        uint256 expectedBalance = initialSupply * 10 ** token.decimals();
        assertEq(token.balanceOf(user1), expectedBalance);
        assertEq(token.totalSupply(), expectedBalance);

        console.log("Initial supply:", token.totalSupply());
        launcher.mintExistingToken(tokenAddress, 10000);
        assertEq(token.balanceOf(user1), expectedBalance + 10000 * 10 ** token.decimals());
        console.log("Balance after minting:", token.balanceOf(user1));

        vm.stopPrank();
    }
}