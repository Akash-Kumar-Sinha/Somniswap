import { useState } from "react";
import { CONTRACT_ADDRESS, publicClient, walletClient } from "@/utils/constant";
import { PoolManagerAbi } from "@/contracts/abi/PoolManagerAbi";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";

import { Button } from "./ui/button";
import { PlusSquare, Loader2 } from "lucide-react";
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
import type { TokenInfo } from "@/utils/types";
import type { Address } from "viem";
import { toast } from "sonner";

interface CreatePoolProps {
  getAllTokens: () => Promise<void>;
}

const CreatePool = ({ getAllTokens }: CreatePoolProps) => {
  const [open, setOpen] = useState(false);
  const [tokenALoading, setTokenALoading] = useState(false);
  const [tokenBLoading, setTokenBLoading] = useState(false);
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

  async function getTokenMetadata(tokenAddress: Address) {
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
    if (!address.startsWith("0x") || address.length !== 42) {
      if (which === "A") {
        setTokenA({ name: "", symbol: "", tokenAddress: address });
      } else {
        setTokenB({ name: "", symbol: "", tokenAddress: address });
      }
      return;
    }

    if (which === "A") setTokenALoading(true);
    else setTokenBLoading(true);

    const { name, symbol } = await getTokenMetadata(address as Address);

    if (which === "A") {
      setTokenA({ name, symbol, tokenAddress: address });
      setTokenALoading(false);
    } else {
      setTokenB({ name, symbol, tokenAddress: address });
      setTokenBLoading(false);
    }
  };

  const createPool = async () => {
    try {
      if (!tokenA.tokenAddress || !tokenB.tokenAddress) {
        console.error("Missing token addresses");
        return;
      }

      const [account] = await walletClient.getAddresses();

      await walletClient.writeContract({
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

      setOpen(false);

      toast.success(`Pool created successfully`);

      await getAllTokens();
    } catch (err) {
      console.error("CreatePool error:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-fit font-semibold flex items-center gap-2 px-3 py-2 text-base sm:text-base md:text-lg sm:px-4 sm:py-2">
            <PlusSquare className="w-5 h-5" />
            <span className="hidden xs:inline">Create Pool</span>
            <span className="inline xs:hidden">Create</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md p-4 sm:p-6 rounded-2xl text-sm sm:text-base">
          <DialogHeader>
            <DialogTitle>Create New Pool</DialogTitle>
            <DialogDescription>
              Enter token addresses. The name & symbol will auto-fill.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 mt-2 sm:flex-row">
            <div className="flex-1 flex flex-col gap-2">
              <span className="font-semibold text-sm mb-1">Token A</span>
              <Input
                placeholder="Token A Address (0x...)"
                value={tokenA.tokenAddress}
                onChange={(e) => handleAddressChange("A", e.target.value)}
              />
              <div className="relative">
                <Input
                  placeholder="Token A Name"
                  value={tokenA.name}
                  readOnly
                />
                {tokenALoading && (
                  <Loader2 className="animate-spin absolute right-2 top-2 w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="relative">
                <Input
                  placeholder="Token A Symbol"
                  value={tokenA.symbol}
                  readOnly
                />
                {tokenALoading && (
                  <Loader2 className="animate-spin absolute right-2 top-2 w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2 mt-4 sm:mt-0">
              <span className="font-semibold text-sm mb-1">Token B</span>
              <Input
                placeholder="Token B Address (0x...)"
                value={tokenB.tokenAddress}
                onChange={(e) => handleAddressChange("B", e.target.value)}
              />
              <div className="relative">
                <Input
                  placeholder="Token B Name"
                  value={tokenB.name}
                  readOnly
                />
                {tokenBLoading && (
                  <Loader2 className="animate-spin absolute right-2 top-2 w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="relative">
                <Input
                  placeholder="Token B Symbol"
                  value={tokenB.symbol}
                  readOnly
                />
                {tokenBLoading && (
                  <Loader2 className="animate-spin absolute right-2 top-2 w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={createPool} className="w-full">
              Confirm & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatePool;
