import React, { useCallback, useState } from "react";
import { Droplet } from "lucide-react";
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
}

const PullLiquidity: React.FC<PullLiquidityProps> = ({
  poolAddress,
  address,
  lpBalance,
  fetchLpBalance,
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
    } catch (error) {
      console.error("Error removing liquidity:", error);
      toast.error("Failed to remove liquidity.");
    } finally {
      setRemoving(false);
    }
  }, [poolAddress, lpBalance, address, fetchLpBalance]);

  return (
    <Button
      onClick={handleRemoveLiquidity}
      disabled={removing}
      className="w-fit font-semibold flex items-center gap-2 px-3 py-2 text-base sm:text-base md:text-lg sm:px-4 sm:py-2"
    >
      <Droplet className="w-5 h-5" />
      <span className="hidden xs:inline">
        {removing ? "Removing Liquidity…" : "Remove Liquidity"}
      </span>
      <span className="inline xs:hidden">
        {removing ? "Removing…" : "Remove"}
      </span>
    </Button>
  );
};

export default PullLiquidity;
