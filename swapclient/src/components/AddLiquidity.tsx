import { useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PoolAbi } from "@/contracts/abi/PoolAbi";
import { publicClient, walletClient } from "@/utils/constant";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { TokenInfo } from "@/utils/types";
import { parseUnits } from "viem";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";

type AddLiquidityProps = {
  poolAddress: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  accountAddress: string;
  fetchLpBalance: () => Promise<void>;
};

const AddLiquidity = ({
  poolAddress,
  tokenA,
  tokenB,
  accountAddress,
  fetchLpBalance,
}: AddLiquidityProps) => {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB) {
      toast.error("Please select tokens first");
      return;
    }
    if (!amountA || !amountB) {
      toast.error("Enter valid amounts");
      return;
    }

    try {
      setLoading(true);

      const amountADecimals = parseUnits(amountA, 18);
      const amountBDecimals = parseUnits(amountB, 18);

      console.log("Preparing liquidity:", {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol,
        amountADecimals: amountADecimals.toString(),
        amountBDecimals: amountBDecimals.toString(),
      });

      toast.info(`Approving ${tokenA.symbol}...`);
      await walletClient.writeContract({
        address: tokenA.tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress, amountADecimals],
        account: accountAddress as `0x${string}`,
      });

      toast.info(`Approving ${tokenB.symbol}...`);
      await walletClient.writeContract({
        address: tokenB.tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress, amountBDecimals],
        account: accountAddress as `0x${string}`,
      });

      toast.info("Adding liquidity...");
      const hash = await walletClient.writeContract({
        address: poolAddress as `0x${string}`,
        abi: PoolAbi,
        functionName: "addLiquidity",
        args: [amountADecimals, amountBDecimals],
        account: accountAddress as `0x${string}`,
      });

      toast.info("Transaction submitted...");
      await publicClient.waitForTransactionReceipt({
        hash,
      });
      toast.success("Liquidity added successfully!");
      await fetchLpBalance();
      setAmountA("");
      setAmountB("");
    } catch (err) {
      console.error("Liquidity error:", err);
      toast.error("Failed to add liquidity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-fit font-semibold flex items-center gap-2 px-3 py-2 text-base sm:text-base md:text-lg sm:px-4 sm:py-2">
          <PlusCircle className="w-5 h-5" />
          <span className="hidden xs:inline">Add Liquidity</span>
          <span className="inline xs:hidden">Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full p-4 sm:p-6 rounded-2xl text-sm sm:text-base">
        <DialogHeader>
          <DialogTitle>Add Liquidity</DialogTitle>
          <DialogDescription>
            Provide equal value of {tokenA?.symbol} and {tokenB?.symbol}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 mt-2">
          <div className="flex flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium">
                Amount {tokenA?.symbol}
              </label>
              <Input
                placeholder={`Enter ${tokenA?.symbol} amount`}
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium">
                Amount {tokenB?.symbol}
              </label>
              <Input
                placeholder={`Enter ${tokenB?.symbol} amount`}
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full mt-6 font-semibold"
            disabled={loading || !tokenA || !tokenB}
            onClick={handleAddLiquidity}
          >
            {loading ? "Processing..." : "Add Liquidity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLiquidity;
