// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenLauncher {
    event TokenLaunched(
        address indexed token,
        string name,
        string symbol,
        uint256 initialSupply,
        address indexed owner
    );

    function launchToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external returns (address) {
        ERC20WithMint newToken = new ERC20WithMint(name, symbol);
        newToken.mint(msg.sender, initialSupply * 10 ** newToken.decimals());

        emit TokenLaunched(address(newToken), name, symbol, initialSupply, msg.sender);

        return address(newToken);
    }

    function mintExistingToken(address tokenAddress, uint256 amount) external {
        ERC20WithMint token = ERC20WithMint(tokenAddress);
        token.mint(msg.sender, amount * 10 ** token.decimals());
    }
}

contract ERC20WithMint is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
