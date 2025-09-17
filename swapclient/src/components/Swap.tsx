import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReserveState, TokenInfo } from "@/utils/types";
import { PoolManagerAbi } from "@/contracts/abi/PoolManagerAbi";
import { PoolAbi } from "@/contracts/abi/PoolAbi";
import {
  POOL_MANAGER_ADDRESS,
  publicClient,
  walletClient,
} from "@/utils/constant";
import { type Address, formatUnits, type Hash, parseUnits } from "viem";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";
import { Input } from "./ui/input";
import {
  ArrowUpDown,
  Loader2,
  RefreshCw,
  TrendingUp,
  Info,
  Zap,
} from "lucide-react";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";

interface SwapProps {
  address: Address;
  poolAddress: Address | null;
  lpBalance: string;
  tokenA: TokenInfo | null;
  setTokenA: (token: TokenInfo | null) => void;
  tokenB: TokenInfo | null;
  setTokenB: (token: TokenInfo | null) => void;
  reserves: ReserveState | null;
  fetchReserves: () => Promise<void>;
  allTokens: TokenInfo[];
  lpSupply: string;
}


const Swap: React.FC<SwapProps> = ({
  address,
  poolAddress,
  lpBalance,
  tokenA,
  setTokenA,
  tokenB,
  setTokenB,
  reserves,
  fetchReserves,
  allTokens,
  lpSupply,
}) => {
  const [pairedToken, setPairedToken] = useState<TokenInfo[]>([]);
  const [amountIn, setAmountIn] = useState<string>("");
  const [amountOut, setAmountOut] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isPairedTokensLoading, setIsPairedTokensLoading] = useState(false);
  const [isPoolDataLoading, setIsPoolDataLoading] = useState(false);
  const [isReservesLoading, setIsReservesLoading] = useState(false);

  const fetchPairedTokens = useCallback(async () => {
    if (!tokenA) {
      setPairedToken([]);
      return;
    }
    setIsPairedTokensLoading(true);
    try {
      const pairedTokens = (await publicClient.readContract({
        address: POOL_MANAGER_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "getPairedTokenInfobyAddress",
        args: [tokenA.tokenAddress],
      })) as TokenInfo[];
      setPairedToken(pairedTokens);
    } catch (error) {
      console.error("Error fetching paired tokens:", error);
    } finally {
      setIsPairedTokensLoading(false);
    }
  }, [tokenA]);

  useEffect(() => {
    fetchPairedTokens();
  }, [fetchPairedTokens]);

  const fetchPoolSwapTokens = useCallback(async () => {
    if (!poolAddress) return;
    setIsPoolDataLoading(true);
    try {
      const [tA, tB] = (await publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolAbi,
        functionName: "getPoolSwapToken",
      })) as [Address, Address];
      console.log("Pool swap tokens:", tA, tB);
    } catch (error) {
      console.error("Error fetching pool swap tokens:", error);
    } finally {
      setIsPoolDataLoading(false);
    }
  }, [poolAddress]);

  useEffect(() => {
    fetchPoolSwapTokens();
  }, [fetchPoolSwapTokens]);

  const onSwap = async () => {
    if (!tokenA || !tokenB || !poolAddress || !amountIn) {
      toast.error("Please select tokens and enter a valid amount.");
      return;
    }
    setIsApproving(true);
    setIsSwapping(false);
    try {
      const tokenADecimals = Number(
        await publicClient.readContract({
          address: tokenA.tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
      );
      const amountInDecimals = parseUnits(amountIn, tokenADecimals);

      toast.info(`Approving ${tokenA.symbol}...`);

      await walletClient.writeContract({
        address: tokenA.tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress, amountInDecimals],
        account: address as Address,
      });
      setIsApproving(false);
      setIsSwapping(true);

      const swapTx = (await walletClient.writeContract({
        address: poolAddress as Address,
        abi: PoolAbi,
        functionName: "swap",
        args: [tokenA.tokenAddress, tokenB.tokenAddress, amountInDecimals],
        account: address as Address,
      })) as Hash;
      toast.success("Swap transaction sent!");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: swapTx,
      });
      console.log("Transaction confirmed:", receipt);
      toast.success("Swap transaction confirmed!");

      setIsReservesLoading(true);
      await fetchReserves();
      setIsReservesLoading(false);
      setAmountIn("");
      setAmountOut("");
    } catch (error) {
      setIsApproving(false);
      setIsSwapping(false);
      console.error("Error during swap:", error);
      toast.error("Swap failed. Please try again.");
    } finally {
      setIsApproving(false);
      setIsSwapping(false);
    }
  };

  const onSwitch = async () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountIn("");
    setAmountOut("");
    setIsReservesLoading(true);
    await fetchReserves();
    setIsReservesLoading(false);
  };

  const fetchQuote = useCallback(async () => {
    if (!tokenA || !tokenB || !poolAddress || !amountIn) {
      setAmountOut("");
      return;
    }
    try {
      setIsFetching(true);
      const tokenADecimals = Number(
        await publicClient.readContract({
          address: tokenA.tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
      );
      const amountInDecimals = parseUnits(amountIn, tokenADecimals);
      const quotedAmountOut = (await publicClient.readContract({
        address: poolAddress,
        abi: PoolAbi,
        functionName: "quoteSwap",
        args: [tokenA.tokenAddress, amountInDecimals],
      })) as bigint;

      const tokenBDecimals = Number(
        await publicClient.readContract({
          address: tokenB.tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
      );
      const humanOut = formatUnits(quotedAmountOut, tokenBDecimals);
      setAmountOut(humanOut);
    } catch (error) {
      console.error("Error fetching quote:", error);
      setAmountOut("");
    } finally {
      setIsFetching(false);
    }
  }, [amountIn, tokenA, tokenB, poolAddress]);

  useEffect(() => {
    if (!amountIn || !tokenA || !tokenB || !poolAddress) {
      setAmountOut("");
      return;
    }

    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(timer);
  }, [amountIn, fetchQuote, tokenA, tokenB, poolAddress]);

  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-[var(--color-background)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-[var(--color-primary)]/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl bg-[var(--color-card)] backdrop-blur-xl rounded-3xl shadow-2xl border border-[var(--color-border)] p-4 sm:p-6 transition-all duration-300 hover:shadow-3xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] tracking-tight mb-1">
            Somnia Swap
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-muted-foreground)] font-medium">
            If a pool does not exist, please create one.
          </p>
        </div>

        <div className="mb-6">
          {poolAddress && (
            <div className="bg-[var(--color-muted)]/50 rounded-2xl p-3 border border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-xs font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
                  Pool Information
                </span>
              </div>
              {isReservesLoading || isPoolDataLoading ? (
                <div className="flex items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
                  <Skeleton className="w-20 h-5" />
                  <span>/</span>
                  <Skeleton className="w-20 h-5" />
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  <span className="text-sm ml-2">
                    {isPoolDataLoading
                      ? "Loading pool data..."
                      : "Updating reserves..."}
                  </span>
                </div>
              ) : (
                <div className="text-center flex items-center justify-center flex-wrap">
                  <span className="text-lg font-bold text-[var(--color-primary)]">
                    {tokenA?.symbol} / {tokenB?.symbol}
                  </span>
                  <div className="flex justify-center gap-2 mt-1">
                    <span className="font-mono text-sm text-[var(--color-foreground)] bg-[var(--color-background)] px-2 py-1 rounded-lg">
                      {reserves?.reserveA}
                    </span>
                    <span className="text-[var(--color-muted-foreground)]">
                      /
                    </span>
                    <span className="font-mono text-sm text-[var(--color-foreground)] bg-[var(--color-background)] px-2 py-1 rounded-lg">
                      {reserves?.reserveB}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-[var(--color-muted)]/30 rounded-2xl p-4 border border-[var(--color-border)] transition-all duration-200 hover:bg-[var(--color-muted)]/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wide">
                  From
                </label>
                <Zap className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] font-mono bg-[var(--color-background)] px-2 py-1 rounded-lg">
                {tokenA ? tokenA.symbol : "Select Token"}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Select
                value={tokenA?.tokenAddress || ""}
                onValueChange={(val) => {
                  const selected = allTokens.find(
                    (t) => t.tokenAddress === val
                  );
                  if (selected) setTokenA(selected);
                }}
                disabled={allTokens.length === 0}
              >
                <SelectTrigger className="w-44 sm:w-52 h-10 text-sm font-medium bg-[var(--color-card)] border-2 border-[var(--color-border)] rounded-xl transition-all duration-200 hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)]">
                  {allTokens.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select Token A" />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {allTokens.map((token) => (
                    <SelectItem
                      key={token.tokenAddress}
                      value={token.tokenAddress}
                      className="text-sm hover:bg-[var(--color-muted)]/50 transition-colors"
                    >
                      {token.name} ({token.symbol}) —{" "}
                      {token.tokenAddress.slice(0, 6)}...
                      {token.tokenAddress.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                inputMode="decimal"
                className="flex-1 h-10 text-base font-mono bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl px-3 transition-all duration-200 hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)]"
                disabled={isApproving || isSwapping}
              />
            </div>
          </div>

          <div className="flex justify-center -my-2">
            <Button
              className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 rounded-full shadow-lg w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={onSwitch}
              disabled={!tokenA || !tokenB || isReservesLoading}
              title="Switch tokens"
              size="icon"
            >
              {isReservesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="bg-[var(--color-muted)]/30 rounded-2xl p-4 border border-[var(--color-border)] transition-all duration-200 hover:bg-[var(--color-muted)]/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wide">
                  To
                </Label>
                <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] font-mono bg-[var(--color-background)] px-2 py-1 rounded-lg">
                {tokenB ? tokenB.symbol : "Select Token"}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Select
                value={tokenB?.tokenAddress || ""}
                onValueChange={(val) => {
                  const selected = pairedToken.find(
                    (t) => t.tokenAddress === val
                  );
                  if (selected) setTokenB(selected);
                }}
                disabled={!tokenA || isPairedTokensLoading}
              >
                <SelectTrigger className="w-44 sm:w-52 h-10 text-sm font-medium bg-[var(--color-card)] border-2 border-[var(--color-border)] rounded-xl transition-all duration-200 hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)]">
                  {isPairedTokensLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <SelectValue
                      placeholder={
                        tokenA
                          ? pairedToken.length
                            ? "Select Token B"
                            : "No paired tokens"
                          : "Select Token A first"
                      }
                    />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {pairedToken.map((token) => (
                    <SelectItem
                      key={token.tokenAddress}
                      value={token.tokenAddress}
                      className="text-sm hover:bg-[var(--color-muted)]/50 transition-colors"
                    >
                      {token.name} ({token.symbol}) —{" "}
                      {token.tokenAddress.slice(0, 6)}...
                      {token.tokenAddress.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Input
                  placeholder="0.0"
                  value={amountOut}
                  readOnly
                  className="h-10 text-base font-mono bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl px-3 pr-14"
                />
                {isFetching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                  </div>
                )}
              </div>
              <Button
                onClick={fetchQuote}
                disabled={!poolAddress || !amountIn || isFetching}
                size="sm"
                variant="ghost"
                className="h-10 w-10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-all duration-200"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)] mt-2 min-h-[1.25em] transition-all duration-300">
              {isFetching ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Fetching quote...</span>
                </div>
              ) : amountOut ? (
                <div className="flex items-center gap-2 text-[var(--color-primary)] font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    Expected output ≈ {amountOut} {tokenB?.symbol ?? ""}
                  </span>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>

        {!!poolAddress && tokenA && tokenB && (
          <div className="mt-6 bg-[var(--color-muted)]/20 rounded-2xl p-4 border border-[var(--color-border)] space-y-2 transition-all duration-300">
            <h3 className="text-base font-bold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--color-primary)]" />
              Pool Details
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center p-2 bg-[var(--color-background)] rounded-xl hover:bg-[var(--color-muted)]/30 transition-colors">
                <span className="font-semibold text-sm text-[var(--color-foreground)]">
                  Trading Fee
                </span>
                <span className="font-mono text-xs text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-lg">
                  0.5%
                </span>
              </div>

              <div className="flex justify-between items-center p-2 bg-[var(--color-background)] rounded-xl hover:bg-[var(--color-muted)]/30 transition-colors">
                <span className="font-semibold text-sm text-[var(--color-foreground)]">
                  Your LP Balance
                </span>
                {lpBalance ? (
                  <span className="font-mono text-sm text-[var(--color-foreground)]">
                    {lpBalance}
                  </span>
                ) : (
                  <Skeleton className="w-16 h-4" />
                )}
              </div>

              <div className="flex justify-between items-center p-2 bg-[var(--color-background)] rounded-xl hover:bg-[var(--color-muted)]/30 transition-colors">
                <span className="font-semibold text-sm text-[var(--color-foreground)]">
                  Total LP Supply
                </span>
                {lpSupply ? (
                  <span className="font-mono text-sm text-[var(--color-foreground)]">
                    {lpSupply}
                  </span>
                ) : (
                  <Skeleton className="w-16 h-4" />
                )}
              </div>
            </div>
          </div>
        )}

        <Button
          className="mt-6 w-full h-12 rounded-2xl text-lg font-bold shadow-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
          onClick={onSwap}
          disabled={
            isApproving ||
            isSwapping ||
            !poolAddress ||
            !amountIn ||
            !tokenA ||
            !tokenB
          }
        >
          <div className="flex items-center justify-center gap-3">
            {(isApproving || isSwapping) && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            <span>
              {isApproving
                ? "Approving…"
                : isSwapping
                ? "Swapping…"
                : !poolAddress
                ? "Pool not found"
                : "Swap Tokens"}
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default Swap;
