import { useState } from "react";
import { CONTRACT_ADDRESS, publicClient, walletClient } from "@/utils/constant";
import { PoolManagerAbi } from "@/contracts/abi/PoolManagerAbi";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";

type TokenInfo = {
  name: string;
  symbol: string;
  tokenAddress: string;
};

const CreatePool = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [tokenA, setTokenA] = useState<TokenInfo>({
    name: "",
    symbol: "",
    tokenAddress: "",
  });
  const [tokenB, setTokenB] = useState<TokenInfo>({
    name: "",
    symbol: "",
    tokenAddress: "",
  });

  const createPool = async () => {
    try {
      const [account] = await walletClient.getAddresses();
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "createPool",
        args: [
          tokenA.name,
          tokenA.symbol,
          tokenA.tokenAddress,
          tokenB.name,
          tokenB.symbol,
          tokenB.tokenAddress,
        ],
        account,
      });

      setTxHash(hash);
      setOpen(false);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction confirmed:", receipt);
    } catch (err) {
      console.error("CreatePool error:", err);
    }
  };

  async function getTokenMetadata(tokenAddress: `0x${string}`) {
    try {
      const name = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "name",
      });
      const symbol = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      });
      return { name: String(name), symbol: String(symbol) };
    } catch (err) {
      console.error("Error fetching metadata:", err);
      return { name: "", symbol: "" };
    }
  }

  const handleAddressChange = async (which: "A" | "B", address: string) => {
    if (which === "A") {
      setTokenA((prev) => ({ ...prev, tokenAddress: address }));
      if (address && address.startsWith("0x") && address.length === 42) {
        const { name, symbol } = await getTokenMetadata(
          address as `0x${string}`
        );
        setTokenA({ name, symbol, tokenAddress: address });
      }
    } else {
      setTokenB((prev) => ({ ...prev, tokenAddress: address }));
      if (address && address.startsWith("0x") && address.length === 42) {
        const { name, symbol } = await getTokenMetadata(
          address as `0x${string}`
        );
        setTokenB({ name, symbol, tokenAddress: address });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="px-4 py-2 bg-blue-500 text-white rounded">
            Create Pool
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Pool</DialogTitle>
            <DialogDescription>
              Enter token addresses. The name & symbol will auto-fill.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Input
              placeholder="Token A Address (0x...)"
              value={tokenA.tokenAddress}
              onChange={(e) => handleAddressChange("A", e.target.value)}
            />
            <Input placeholder="Token A Name" value={tokenA.name} readOnly />
            <Input
              placeholder="Token A Symbol"
              value={tokenA.symbol}
              readOnly
            />

            <Input
              placeholder="Token B Address (0x...)"
              value={tokenB.tokenAddress}
              onChange={(e) => handleAddressChange("B", e.target.value)}
            />
            <Input placeholder="Token B Name" value={tokenB.name} readOnly />
            <Input
              placeholder="Token B Symbol"
              value={tokenB.symbol}
              readOnly
            />
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={createPool} className="w-full">
              Confirm & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {txHash && (
        <p className="text-sm">
          Tx Hash:{" "}
          <a
            href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 underline"
          >
            {txHash.slice(0, 6)}...{txHash.slice(-4)}
          </a>
        </p>
      )}
    </div>
  );
};

export default CreatePool;
