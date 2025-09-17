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
      console.log("LP Token Address:", lpTokenAddress);
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
      });
      const request = await walletClient.writeContract({
        address: poolAddress,
        abi: PoolAbi,
        functionName: "pullLiquidityAsLp",
        account: address as Address,
      });
      console.log("Remove liquidity request:", request);
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
      className="w-full font-semibold flex items-center justify-center gap-3 px-4 py-3 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/40 shadow-lg hover:shadow-xl transition-all duration-200 min-h-[44px] active:scale-95 disabled:active:scale-100 border-0"
    >
      {removing ? (
        <>
          <Loader2 className="animate-spin h-5 w-5 text-primary-foreground" />
          <span className="hidden xs:inline">Removing Liquidity…</span>
          <span className="inline xs:hidden">Removing…</span>
        </>
      ) : (
        <>
          <Droplet className="w-5 h-5 text-primary-foreground" />
          <span className="hidden xs:inline">Remove Liquidity</span>
          <span className="inline xs:hidden">Remove</span>
          {lpBalance && (
            <span className="ml-auto text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full hidden sm:inline">
              {parseFloat(lpBalance).toFixed(4)}
            </span>
          )}
        </>
      )}
    </Button>
  );
};

export default PullLiquidity;
