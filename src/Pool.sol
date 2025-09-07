// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAKSLPToken} from "./PoolToken/IAKSLPToken.sol";
import {Helper } from "./Helper/Helper.sol";

import {IPool} from "./Helper/IPool.sol";

contract Pool is IPool {
    IERC20 public tokenA;
    IERC20 public tokenB;
    IAKSLPToken public lpToken;

    uint256 public constant FEE_RATE = 5;

    constructor(address _tokenA, address _tokenB, address _lpToken) {
        if (_tokenA < _tokenB) {
            tokenA = IERC20(_tokenA);
            tokenB = IERC20(_tokenB);
        } else {
            tokenA = IERC20(_tokenB);
            tokenB = IERC20(_tokenA);
        }

        lpToken = IAKSLPToken(_lpToken);
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "Invalid or insufficient amount");

        uint256 mintAmount;
        uint256 totalSupply = lpToken.totalSupply();
        uint256 reserveA = tokenA.balanceOf(address(this));
        uint256 reserveB = tokenB.balanceOf(address(this));
        if (totalSupply == 0) {
            require(amountA == amountB, "Invalid or insufficient amount!");

            mintAmount = Helper.sqrt(amountA * amountB);

        } else {
            require(amountA * reserveB == amountB * reserveA, "Invalid or insufficient amount!");

            uint256 mintFromA = totalSupply * amountA / reserveA;
            uint256 mintFromB = totalSupply * amountB / reserveB;
            mintAmount = Helper.min(mintFromA, mintFromB);
        }

        require(tokenA.transferFrom(msg.sender, address(this), amountA), "Transfer tokenA failed");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "Transfer tokenB failed");
        
        lpToken.mint(msg.sender, mintAmount);
        emit LiquidityAdded(msg.sender, amountA, amountB, mintAmount);
    }
    
    function pullLiquidityAsLp() public {
        uint256 burnedAmount = lpToken.balanceOf(msg.sender);
        require(burnedAmount > 0, "This address is not a liquidity provider");
    
        uint256 totalSupply = lpToken.totalSupply();
        require(totalSupply > 0, "Token not minted yet");
    
        uint256 reserveA = tokenA.balanceOf(address(this));
        uint256 reserveB = tokenB.balanceOf(address(this));
    
        uint256 amountA = reserveA * burnedAmount / totalSupply; 
        uint256 amountB = reserveB * burnedAmount / totalSupply;
    
        lpToken.burnFrom(msg.sender, burnedAmount);
    
        require(tokenA.transfer(msg.sender, amountA), "Transfer tokenA failed");
        require(tokenB.transfer(msg.sender, amountB), "Transfer tokenB failed");
        emit LiquidityPulled(msg.sender, burnedAmount, amountA, amountB);
    }

    function swap(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn
    ) external returns (uint256 amountOut) {

        require(
            (tokenIn == address(tokenA) && tokenOut == address(tokenB)) ||
            (tokenIn == address(tokenB) && tokenOut == address(tokenA)),
            "Invalid token pair"
        );

        uint256 reserveIn;
        uint256 reserveOut;
       
        if (tokenIn == address(tokenA)) {
            reserveIn = tokenA.balanceOf(address(this));
            reserveOut = tokenB.balanceOf(address(this));
        } else {
            reserveIn = tokenB.balanceOf(address(this));
            reserveOut = tokenA.balanceOf(address(this));
        }

        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer failed");

        uint256 amountInWithFee = amountIn * (1000 - FEE_RATE);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);

        require(amountOut > 0, "Insufficient output amount");

        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Output transfer failed");
        emit Swap(msg.sender, tokenIn, amountIn, tokenOut, amountOut);
    }

    function quoteSwap(address tokenIn, uint256 amountIn) 
        external 
        view 
        returns (uint256 amountOut) 
    {
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "Invalid token"
        );

        (uint256 reserveIn, uint256 reserveOut) = tokenIn == address(tokenA)
            ? (tokenA.balanceOf(address(this)), tokenB.balanceOf(address(this)))
            : (tokenB.balanceOf(address(this)), tokenA.balanceOf(address(this)));

        uint256 amountInWithFee = amountIn * (1000 - FEE_RATE);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }


    function getPoolTokenShare(address user) public view returns(uint256){
        return lpToken.balanceOf(user);
    }

    function getPoolTokenSupply() public view returns(uint256){
        return lpToken.totalSupply();
    }

    function getPoolReserves() external view returns(uint256 reserveA, uint256 reserveB){
        reserveA = tokenA.balanceOf(address(this));
        reserveB = tokenB.balanceOf(address(this));
        return (reserveA, reserveB);
    }

    function getPoolTokenAddress() public view returns(address){
        return address(lpToken);
    }

    function getPoolSwapToken() public view returns(address, address){
        return (address(tokenA), address(tokenB));
    }
}
