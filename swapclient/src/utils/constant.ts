import { createPublicClient, http } from "viem";
import { somniaTestnet } from "viem/chains";
import { createWalletClient, custom } from "viem";

export const CONTRACT_ADDRESS = "0xE02439e785415ce21D7e9f57a18f7ffCeBB33eaD";
export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

export const walletClient = createWalletClient({
  chain: somniaTestnet,
  transport: custom(window.ethereum!),
});
