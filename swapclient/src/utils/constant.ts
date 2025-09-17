import { createPublicClient, http } from "viem";
import { somniaTestnet } from "viem/chains";
import { createWalletClient, custom } from "viem";

export const POOL_MANAGER_ADDRESS = "0xfa342983D775a6af6047f0B3daFf15D14984790b";
export const TOKEN_LAUNCHER_ADDRESS = "0x1CC62993D5E51ee0BcF4508A642a7d5FB3f9057D"
export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

export const walletClient = createWalletClient({
  chain: somniaTestnet,
  transport: custom(window.ethereum!),
});
