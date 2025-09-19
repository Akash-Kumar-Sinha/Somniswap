import { createPublicClient, http } from "viem";
import { somniaTestnet } from "viem/chains";
import { createWalletClient, custom } from "viem";

export const POOL_MANAGER_ADDRESS =
  "0x19E86FaE03e6ab8c11D46BbC1638bD183De2493a";

export const TOKEN_LAUNCHER_ADDRESS =
  "0x1CC62993D5E51ee0BcF4508A642a7d5FB3f9057D";

export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(),
});

export const getWalletClient = () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Please install a Web3 wallet like MetaMask");
  }
  return createWalletClient({
    chain: somniaTestnet,
    transport: custom(window.ethereum),
  });
};

let _walletClient: ReturnType<typeof getWalletClient> | null = null;

export const walletClient = new Proxy(
  {} as ReturnType<typeof getWalletClient>,
  {
    get(_target, prop) {
      if (!_walletClient) {
        _walletClient = getWalletClient();
      }
      return _walletClient[prop as keyof typeof _walletClient];
    },
  }
);
