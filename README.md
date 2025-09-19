# AKSSwap - Decentralized Exchange

A decentralized exchange (DEX) built on the Somnia Network with automated market maker (AMM) functionality for token swaps and liquidity provision.

## Architecture

### Pool Architecture Diagrams

![Liquidity Pool Architecture 1](liquidity_pool1.png)

### Pool Architecture Diagrams with Pool Manager

![Liquidity Pool Architecture 2](liquidity_pool2.png)

## Deployed Contracts

### Somnia Network Testnet

#### Smart Contracts

- **PoolManager**: `0x19E86FaE03e6ab8c11D46BbC1638bD183De2493a`
- **TokenLauncher**: `0x1CC62993D5E51ee0BcF4508A642a7d5FB3f9057D`

#### Test Tokens

- **SOM Token**: `0x4D1f4Be2f102B5305ec6F27510Fae9f04cA16B1f`
- **ESTT Token**: `0x5c93D149C738644909606E2115d34ac9E26b7973`
- **SOMSTT Token**: `0x660d1ed17A0f905bfCAFd3449a9D56C3BA38CD66`

## Deployment

To deploy the PoolManager contract:

```bash
forge create --rpc-url https://dream-rpc.somnia.network --private-key <PRIVATE_KEY> --broadcast src/PoolManager.sol:PoolManager
```

## User Workflows

### For Liquidity Providers

1. **Connect Wallet** - Connect your wallet to the DApp
2. **Get Test Tokens** - Use the token launchpad to create test tokens or use existing ones
3. **Create Pool** - Create a liquidity pool for your token pair if it doesn't exist
4. **Add Liquidity**:
   - Select two tokens for liquidity provision
   - Specify the amount of one token
   - DApp calculates the required amount of the second token
   - Approve token spending
   - Confirm transaction
   - Receive LP tokens representing your pool share
5. **Remove Liquidity** - Burn LP tokens to withdraw your liquidity anytime

### For Traders

1. **Connect Wallet** - Connect your wallet to the DApp
2. **Select Tokens** - Choose input and output tokens for the swap
3. **Enter Amount** - Specify the amount of input token to swap
4. **Review Quote** - DApp calculates estimated output based on AMM formula
5. **Execute Swap**:
   - Approve input token spending
   - Confirm swap transaction
   - Receive output tokens

## Notes

- This application is optimized for desktop use
- Only use test tokens on the testnet
- Copy token addresses after creating new tokens through the launchpad
- Mint the test tokens as needed
