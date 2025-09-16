import { createPublicClient, http } from "viem";
import { somniaTestnet } from "viem/chains";
import { createWalletClient, custom } from "viem";

export const CONTRACT_ADDRESS = "0xfa342983D775a6af6047f0B3daFf15D14984790b";

export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

export const walletClient = createWalletClient({
  chain: somniaTestnet,
  transport: custom(window.ethereum!),
});
