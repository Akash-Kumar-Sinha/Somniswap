import { useState } from "react";
import { createWalletClient, custom, type Address } from "viem";
import { somniaTestnet } from "viem/chains";
import Pool from "./Pool";

const Home = () => {
  const [address, setAddress] = useState<Address | null>(null);
  const [connected, setConnected] = useState(false);

  const connectToMetaMask = async () => {
    if (typeof window !== "undefined" && window.ethereum !== undefined) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const walletClient = createWalletClient({
          chain: somniaTestnet,
          transport: custom(window.ethereum),
        });
        const [userAddress] = await walletClient.getAddresses();
        setAddress(userAddress);
        setConnected(true);
        console.log("Connected account:", userAddress);
      } catch (error) {
        console.error("User denied account access:", error);
      }
    } else {
      console.log(
        "MetaMask is not installed or not running in a browser environment!"
      );
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-foreground)]">
      {!connected || !address ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full gap-6 px-4 py-12">
          <img
            src="/somnia.svg"
            alt="Somnia Logo"
            className="h-20 w-20 mb-4 drop-shadow-lg"
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-primary)] mb-2 text-center">
            Somnia Liquidity Pool
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-muted-foreground)] mb-6 text-center max-w-md">
            Swap tokens, create pools, and manage your liquidity with a
            beautiful, responsive interface.
          </p>
          <button
            onClick={connectToMetaMask}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-[var(--color-primary-foreground)] font-bold py-3 px-8 rounded-xl shadow-lg text-lg transition-all"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <Pool address={address} />
      )}
    </div>
  );
};

export default Home;
