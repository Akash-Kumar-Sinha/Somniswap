import { useState } from "react";
import { createWalletClient, custom } from "viem";
import { somniaTestnet } from "viem/chains";
import Pool from "./Pool";

const Home = () => {
  const [address, setAddress] = useState<string>("");
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
    <div>
      {!connected ? (
        <div className="flex flex-col items-center justify-center h-screen w-screen gap-4">
          <h1 className="text-4xl font-bold">Somnia Liquidity Pool</h1>
          <button
            onClick={connectToMetaMask}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
