// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PoolToken/IAKSLPToken.sol";
import "./Helper.sol";

contract Pool {
    IERC20 public aksusdt; 
    IERC20 public aksstt;
    IAKSLPToken public akslptoken;

    uint256 public constant FEE_RATE = 5;

    constructor(address _aksusdtaddress, address _akssttaddress, address _akslptokenaddress){
        aksusdt = IERC20(_aksusdtaddress);
        aksstt = IERC20(_akssttaddress);
        akslptoken = IAKSLPToken(_akslptokenaddress);
    }

    function addLiquidity(uint256 _usdtamount, uint256 _sttamount) external {
        uint256 tokenmintAmount;
        uint256 pooltokenTotalsupply = akslptoken.totalSupply();
        uint256 reserveUsdt = aksusdt.balanceOf(address(this));
        uint256 reserveStt = aksstt.balanceOf(address(this));
        
        if(pooltokenTotalsupply == 0){
            require(_usdtamount == _sttamount, "Invalid or insufficient amount!");

            tokenmintAmount = Helper.sqrt(_usdtamount * _sttamount);

        }else{
            require(_usdtamount * reserveStt == _sttamount * reserveUsdt, "Invalid or insufficient amount!");

            uint256 mintFromUsdt = pooltokenTotalsupply * _usdtamount / reserveUsdt;
            uint256 mintFromStt  = pooltokenTotalsupply * _sttamount / reserveStt;
            tokenmintAmount = Helper.min(mintFromUsdt, mintFromStt);

        }

        require(aksusdt.transferFrom(msg.sender, address(this), _usdtamount), "Transaction aksusdt pool failed");
        require(aksstt.transferFrom(msg.sender, address(this), _sttamount), "Transaction aksstt pool failed");
        
        akslptoken.mint(msg.sender, tokenmintAmount);

    }
    
    function pullLiquidityAsLP() public {
        uint256 burnedAkslptoken = akslptoken.balanceOf(msg.sender);
        require(burnedAkslptoken > 0, "This address is not a liquidity provider");
    
        uint256 pooltokenTotalsupply = akslptoken.totalSupply();
        require(pooltokenTotalsupply > 0, "Token is not minted yet");
    
        uint256 aksusdtAmount = aksusdt.balanceOf(address(this));
        uint256 akssttAmount = aksstt.balanceOf(address(this));
    
        uint256 sttamountPull = akssttAmount * burnedAkslptoken / pooltokenTotalsupply; 
        uint256 usdtamountPull = aksusdtAmount * burnedAkslptoken / pooltokenTotalsupply;
    
        akslptoken.burnFrom(msg.sender, burnedAkslptoken);
    
        require(aksusdt.transfer(msg.sender, usdtamountPull), "Transaction aksusdt failed");
        require(aksstt.transfer(msg.sender, sttamountPull), "Transaction aksstt failed");
    }

    function swap(
        address tokenIn, 
        address tokenOut, 
        uint256 _amountIn
    ) external returns (uint256 amountOut) {

        require(
            (tokenIn == address(aksusdt) && tokenOut == address(aksstt)) ||
            (tokenIn == address(aksstt) && tokenOut == address(aksusdt)),
            "Invalid token pair"
        );

        uint256 reserveIn;
        uint256 reserveOut;
       
        if (tokenIn == address(aksusdt)) {
            reserveIn = aksusdt.balanceOf(address(this));
            reserveOut = aksstt.balanceOf(address(this));
        } else {
            reserveIn = aksstt.balanceOf(address(this));
            reserveOut = aksusdt.balanceOf(address(this));
        }

        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), _amountIn), "Transfer failed");

        uint256 _amountInWithFee = _amountIn * (1000 - FEE_RATE);
        amountOut = (_amountInWithFee * reserveOut) / (reserveIn * 1000 + _amountInWithFee);

        require(amountOut > 0, "Insufficient output amount");

        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Output transfer failed");
    }

    function getPoolTokenShare(address user) public view returns(uint256){
        return akslptoken.balanceOf(user);
    }

    function getPoolTokenSupply() public view returns(uint256){
        return akslptoken.totalSupply();
    }

    function getPoolReserves() public view returns(uint256 usdt, uint256 stt){
        usdt = aksusdt.balanceOf(address(this));
        stt = aksstt.balanceOf(address(this));
        return (usdt, stt);
    }

}
