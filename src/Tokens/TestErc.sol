// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestErc is ERC20{

    constructor() ERC20("TestErc", "TEST") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
     }
}