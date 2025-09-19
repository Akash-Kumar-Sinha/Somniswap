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
import { formatUnits, parseUnits, type Address } from "viem";
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
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingReserves, setLoadingReserves] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [reserves, setReserves] = useState<{
    reserveA: bigint;
    reserveB: bigint;
  } | null>(null);

  const getPoolReserves = useCallback(async () => {
    try {
      setLoadingReserves(true);
      const [reserveA, reserveB] = (await publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolAbi,
        functionName: "getPoolReserves",
      })) as [bigint, bigint];

      setReserves({ reserveA, reserveB });

      return { reserveA, reserveB };
    } catch (error) {
      console.error("Error fetching reserves:", error);
      return null;
    } finally {
      setLoadingReserves(false);
    }
  }, [poolAddress]);

  const checkRatio = useCallback(
    (amountAInput: string, amountBInput: string) => {
      if (!reserves || !amountAInput || !amountBInput) return true;

      const { reserveA, reserveB } = reserves;

      const amountAParsed = parseUnits(amountAInput, 18);
      const amountBParsed = parseUnits(amountBInput, 18);

      if (reserveA === 0n && reserveB === 0n) {
        return amountAParsed === amountBParsed;
      }

      const ratio1 = (amountAParsed * 1_000_000n) / reserveA;
      const ratio2 = (amountBParsed * 1_000_000n) / reserveB;

      const larger = ratio1 > ratio2 ? ratio1 : ratio2;
      const smaller = ratio1 > ratio2 ? ratio2 : ratio1;

      const tolerance = larger / 1000n; // 0.1%
      const difference = larger - smaller;

      const withinTolerance = difference <= tolerance;

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

      setLoadingStep(`Approving ${tokenA.symbol}...`);
      toast.info(`Approving ${tokenA.symbol}...`);
      await walletClient.writeContract({
        address: tokenA.tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress, amountADecimals],
        account: accountAddress as Address,
        chain: walletClient.chain,
      });

      setLoadingStep(`Approving ${tokenB.symbol}...`);
      toast.info(`Approving ${tokenB.symbol}...`);
      await walletClient.writeContract({
        address: tokenB.tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress, amountBDecimals],
        account: accountAddress as Address,
        chain: walletClient.chain,
      });

      setLoadingStep("Adding liquidity...");
      toast.info("Adding liquidity...");
      const hash = await walletClient.writeContract({
        address: poolAddress as Address,
        abi: PoolAbi,
        functionName: "addLiquidity",
        args: [amountADecimals, amountBDecimals],
        account: accountAddress as Address,
        chain: walletClient.chain,
      });

      setLoadingStep("Confirming transaction...");
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
      setLoadingStep("");
    }
  };

  const getLiquidityQuote = useCallback(async () => {
    if (!amountA || parseFloat(amountA) <= 0) {
      setAmountB("");
      return;
    }

    try {
      setLoadingQuote(true);
      const amountADecimals = parseUnits(amountA, 18);

      const quoteB = (await publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolAbi,
        functionName: "liquidityQuote",
        args: [amountADecimals],
      })) as bigint;

      const quotedAmountB = formatUnits(quoteB, 18);
      setAmountB(quotedAmountB);
    } catch (error) {
      console.error("Error fetching liquidity quote:", error);
      if (reserves && reserves.reserveA > 0n && reserves.reserveB > 0n) {
        const amountADecimals = parseUnits(amountA, 18);
        const calculatedAmountB =
          (amountADecimals * reserves.reserveB) / reserves.reserveA;
        setAmountB(formatUnits(calculatedAmountB, 18));
      }
    } finally {
      setLoadingQuote(false);
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

  const isValidRatio = amountA && amountB ? checkRatio(amountA, amountB) : true;
  const isInitialLiquidity =
    reserves && reserves.reserveA === 0n && reserves.reserveB === 0n;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full font-semibold flex items-center justify-center gap-2 px-4 py-3 text-sm sm:text-base rounded-lg shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusCircle className="w-5 h-5 shrink-0 text-primary-foreground" />
          <span className="hidden xs:inline">Add Liquidity</span>
          <span className="inline xs:hidden">Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg mx-auto p-0 rounded-xl border-0 shadow-2xl overflow-hidden bg-card text-card-foreground">
        <div className=" px-6 py-4 ">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
              <PlusCircle className="w-6 h-6 text-primary" />
              Add Liquidity
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {isInitialLiquidity
                ? `Provide equal amounts of ${tokenA?.symbol} and ${tokenB?.symbol} for initial liquidity`
                : `Provide liquidity maintaining the current ratio of ${tokenA?.symbol} and ${tokenB?.symbol}`}
            </DialogDescription>
            <div className="text-xs text-primary text-center mt-2">
              Try switching the pool direction! In case of insufficient
              liquidity, you may need to adjust your amounts. (A to B) or (B to
              A)
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {loadingReserves && (
            <div className="bg-accent/10 border border-accent rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Loading pool information...
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loadingReserves &&
            reserves &&
            reserves.reserveA > 0n &&
            reserves.reserveB > 0n && (
              <div className="bg-accent/10 border border-accent rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Current Pool Ratio
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      1 {tokenA?.symbol} ={" "}
                      {formatUnits(
                        (reserves.reserveB * parseUnits("1", 18)) /
                          reserves.reserveA,
                        18
                      )}{" "}
                      {tokenB?.symbol}
                    </p>
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4">
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {tokenA?.symbol} Amount
              </label>
              <div className="relative">
                <Input
                  placeholder={`Enter ${tokenA?.symbol} amount`}
                  type="number"
                  value={amountA}
                  onChange={handleAmountAChange}
                  className={`h-12 text-base border-2 transition-all duration-200 ${
                    amountA && !isValidRatio
                      ? "border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 focus:border-[var(--color-primary)] hover:border-gray-300"
                  }`}
                  disabled={loading || loadingReserves}
                />
                {tokenA && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {tokenA.symbol}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {tokenB?.symbol} Amount
              </label>
              <div className="relative">
                <Input
                  placeholder={`Enter ${tokenB?.symbol} amount`}
                  type="number"
                  value={amountB}
                  onChange={handleAmountBChange}
                  className={`h-12 text-base border-2 transition-all duration-200 ${
                    amountB && !isValidRatio
                      ? "border-red-300 focus:border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 focus:border-[var(--color-primary)] hover:border-gray-300"
                  }`}
                  disabled={loading || loadingReserves}
                />
                {tokenB && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {loadingQuote && (
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {tokenB.symbol}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {amountA && amountB && !isValidRatio && !loadingQuote && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Invalid Ratio
                  </p>
                  <p className="text-xs text-destructive">
                    The amounts don't match the required pool ratio. Please
                    adjust your inputs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && loadingStep && (
            <div className="bg-accent/10 border border-accent rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-accent mb-1">
                    Processing Transaction
                  </p>
                  <p className="text-xs text-accent">{loadingStep}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-card">
          <Button
            className="w-full h-12 font-semibold text-base rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={
              loading ||
              loadingReserves ||
              loadingQuote ||
              !tokenA ||
              !tokenB ||
              !isValidRatio
            }
            onClick={handleAddLiquidity}
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              <span>Add Liquidity</span>
            </div>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLiquidity;
