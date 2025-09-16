import { useCallback, useEffect, useState } from "react";
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
import { formatUnits, parseUnits } from "viem";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";

type AddLiquidityProps = {
  poolAddress: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  accountAddress: string;
  fetchLpBalance: () => Promise<void>;
  fetchReserves: () => Promise<void>;
  fetchLpSupply: () => Promise<void>;
};

const AddLiquidity = ({
  poolAddress,
  tokenA,
  tokenB,
  accountAddress,
  fetchLpBalance,
  fetchReserves,
  fetchLpSupply,
}: AddLiquidityProps) => {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [loading, setLoading] = useState(false);
  const [reserves, setReserves] = useState<{
    reserveA: bigint;
    reserveB: bigint;
  } | null>(null);

  const getPoolReserves = useCallback(async () => {
    try {
      const [reserveA, reserveB] = (await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: PoolAbi,
        functionName: "getPoolReserves",
      })) as [bigint, bigint];

      setReserves({ reserveA, reserveB });
      console.log("Current reserves:", {
        reserveA: formatUnits(reserveA, 18),
        reserveB: formatUnits(reserveB, 18),
      });

      return { reserveA, reserveB };
    } catch (error) {
      console.error("Error fetching reserves:", error);
      return null;
    }
  }, [poolAddress]);

  const checkRatio = useCallback(
    (amountAInput: string, amountBInput: string) => {
      if (!reserves || !amountAInput || !amountBInput) return true;

      const { reserveA, reserveB } = reserves;

      if (reserveA === 0n && reserveB === 0n) {
        const amountAParsed = parseUnits(amountAInput, 18);
        const amountBParsed = parseUnits(amountBInput, 18);
        const isEqual = amountAParsed === amountBParsed;

        console.log("Empty pool - checking equal amounts:", {
          amountA: formatUnits(amountAParsed, 18),
          amountB: formatUnits(amountBParsed, 18),
          isEqual,
        });

        return isEqual;
      }

      const amountAParsed = parseUnits(amountAInput, 18);
      const amountBParsed = parseUnits(amountBInput, 18);

      const leftSide = amountAParsed * reserveB;
      const rightSide = amountBParsed * reserveA;

      const larger = leftSide > rightSide ? leftSide : rightSide;
      const smaller = leftSide > rightSide ? rightSide : leftSide;

      const tolerance = larger / 1000n;
      const difference = larger - smaller;
      const withinTolerance = difference <= tolerance;

      console.log("Ratio check:", {
        amountA: formatUnits(amountAParsed, 18),
        amountB: formatUnits(amountBParsed, 18),
        reserveA: formatUnits(reserveA, 18),
        reserveB: formatUnits(reserveB, 18),
        leftSide: leftSide.toString(),
        rightSide: rightSide.toString(),
        difference: difference.toString(),
        tolerance: tolerance.toString(),
        withinTolerance: withinTolerance,
        percentageDiff:
          larger > 0n ? Number((difference * 10000n) / larger) / 100 : 0,
        expectedRatio:
          reserveA > 0n
            ? formatUnits((reserveB * amountAParsed) / reserveA, 18)
            : "N/A",
      });

      return withinTolerance;
    },
    [reserves]
  );

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB) {
      toast.error("Please select tokens first");
      return;
    }
    if (!amountA || !amountB) {
      toast.error("Enter valid amounts");
      return;
    }

    if (!checkRatio(amountA, amountB)) {
      toast.error(
        "Invalid ratio! Amounts must maintain the pool's current ratio."
      );
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
      setAmountA("");
      setAmountB("");
      await fetchLpBalance();
      await fetchReserves();
      await fetchLpSupply();
      await getPoolReserves();
    } catch (err) {
      console.error("Liquidity error:", err);
      toast.error("Failed to add liquidity");
    } finally {
      setLoading(false);
    }
  };

  const getLiquidityQuote = useCallback(async () => {
    if (!amountA || parseFloat(amountA) <= 0) {
      setAmountB("");
      return;
    }

    try {
      const amountADecimals = parseUnits(amountA, 18);

      const quoteB = (await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: PoolAbi,
        functionName: "liquidityQuote",
        args: [amountADecimals],
      })) as bigint;

      const quotedAmountB = formatUnits(quoteB, 18);
      setAmountB(quotedAmountB);

      console.log("Liquidity quote:", {
        inputAmountA: amountA,
        quotedAmountB: quotedAmountB,
        amountADecimals: amountADecimals.toString(),
        quoteBDecimals: quoteB.toString(),
      });
    } catch (error) {
      console.error("Error fetching liquidity quote:", error);
      if (reserves && reserves.reserveA > 0n && reserves.reserveB > 0n) {
        const amountADecimals = parseUnits(amountA, 18);
        const calculatedAmountB =
          (amountADecimals * reserves.reserveB) / reserves.reserveA;
        setAmountB(formatUnits(calculatedAmountB, 18));

        console.log("Manual calculation fallback:", {
          inputAmountA: amountA,
          calculatedAmountB: formatUnits(calculatedAmountB, 18),
        });
      }
    }
  }, [amountA, poolAddress, reserves]);

  const handleAmountAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountA(value);
  };

  const handleAmountBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountB(value);
  };

  useEffect(() => {
    if (poolAddress) {
      getPoolReserves();
    }
  }, [poolAddress, getPoolReserves]);

  useEffect(() => {
    if (amountA && parseFloat(amountA) > 0) {
      getLiquidityQuote();
    }
  }, [amountA, getLiquidityQuote]);

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
            {reserves && reserves.reserveA === 0n && reserves.reserveB === 0n
              ? `Provide equal amounts of ${tokenA?.symbol} and ${tokenB?.symbol} for initial liquidity`
              : `Provide liquidity maintaining the current ratio of ${tokenA?.symbol} and ${tokenB?.symbol}`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 mt-2">
          {reserves && reserves.reserveA > 0n && reserves.reserveB > 0n && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              Current ratio: 1 {tokenA?.symbol} ={" "}
              {formatUnits(
                (reserves.reserveB * parseUnits("1", 18)) / reserves.reserveA,
                18
              )}{" "}
              {tokenB?.symbol}
            </div>
          )}

          <div className="flex flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium">
                Amount {tokenA?.symbol}
              </label>
              <Input
                placeholder={`Enter ${tokenA?.symbol} amount`}
                type="number"
                value={amountA}
                onChange={handleAmountAChange}
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
                onChange={handleAmountBChange}
              />
            </div>
          </div>

          {amountA && amountB && !checkRatio(amountA, amountB) && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              ⚠️ Invalid ratio! The amounts don't match the required pool ratio.
            </div>
          )}
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
