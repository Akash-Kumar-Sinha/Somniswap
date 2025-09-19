import React, { useCallback, useState } from "react";
import { Droplet, Loader2 } from "lucide-react";
import { parseUnits, type Address } from "viem";
import { Button } from "./ui/button";
import { publicClient, walletClient } from "@/utils/constant";
import { PoolAbi } from "@/contracts/abi/PoolAbi";
import { toast } from "sonner";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";

interface PullLiquidityProps {
  poolAddress?: Address | null;
  address: Address;
  lpBalance: string;
  fetchLpBalance: () => Promise<void>;
  getAllTokens: () => Promise<void>;
  fetchReserves: () => Promise<void>;
}

const PullLiquidity: React.FC<PullLiquidityProps> = ({
  poolAddress,
  address,
  lpBalance,
  fetchLpBalance,
  getAllTokens,
  fetchReserves,
}) => {
  const [removing, setRemoving] = useState(false);

  const handleRemoveLiquidity = useCallback(async () => {
    if (!poolAddress) return;
    try {
      setRemoving(true);
      const lpTokenAddress = await publicClient.readContract({
        address: poolAddress,
        abi: PoolAbi,
        functionName: "getPoolTokenAddress",
      });
      const lpTokenDecimals = Number(
        await publicClient.readContract({
          address: lpTokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
      );
      await walletClient.writeContract({
        address: lpTokenAddress as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress, parseUnits(lpBalance, lpTokenDecimals)],
        account: address as Address,
        chain: walletClient.chain,
      });
      await walletClient.writeContract({
        address: poolAddress,
        abi: PoolAbi,
        functionName: "pullLiquidityAsLp",
        account: address as Address,
        chain: walletClient.chain,
      });
      toast.success("Liquidity successfully removed!");
      await fetchLpBalance();
      await getAllTokens();
      await fetchReserves();
    } catch (error) {
      console.error("Error removing liquidity:", error);
      toast.error("Failed to remove liquidity.");
    } finally {
      setRemoving(false);
    }
  }, [
    poolAddress,
    lpBalance,
    address,
    fetchLpBalance,
    getAllTokens,
    fetchReserves,
  ]);

  return (
    <Button
      onClick={handleRemoveLiquidity}
      disabled={removing}
      className="w-full font-semibold flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/40 shadow-md hover:shadow-lg transition-all duration-200 min-h-[40px] active:scale-95 disabled:active:scale-100 border-0"
    >
      {removing ? (
        <>
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Removing...</span>
        </>
      ) : (
        <>
          <Droplet className="w-4 h-4" />
          <span>Remove</span>
        </>
      )}
    </Button>
  );
};

export default PullLiquidity;
