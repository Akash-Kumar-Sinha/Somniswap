import { createPublicClient, http } from "viem";
import { somniaTestnet } from "viem/chains";
import { createWalletClient, custom } from "viem";

export const CONTRACT_ADDRESS = "0x5298C714BCA559db2b6129f2170A36DC91EFc0fa";

export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

export const walletClient = createWalletClient({
  chain: somniaTestnet,
  transport: custom(window.ethereum!),
});
