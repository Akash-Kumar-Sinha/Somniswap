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
import { CONTRACT_ADDRESS, publicClient, walletClient } from "@/utils/constant";
import { type Address, formatUnits, type Hash, parseUnits } from "viem";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";
import { Input } from "./ui/input";
import { ArrowUpDown } from "lucide-react";
import { Label } from "./ui/label";

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

  // const [lpTokenAddress, setLpTokenAddress] = useState<Address | null>(null);

  const [amountIn, setAmountIn] = useState<string>("");
  const [amountOut, setAmountOut] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);



  const fetchPairedTokens = useCallback(async () => {
    if (!tokenA) {
      setPairedToken([]);
      return;
    }
    try {
      const pairedTokens = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "getPairedTokenInfobyAddress",
        args: [tokenA.tokenAddress],
      })) as TokenInfo[];
      setPairedToken(pairedTokens);
    } catch (error) {
      console.error("Error fetching paired tokens:", error);
    }
  }, [tokenA]);

  useEffect(() => {
    fetchPairedTokens();
  }, [fetchPairedTokens]);



  // const fetchLpTokenAddress = useCallback(async () => {
  //   if (!poolAddress) {
  //     setLpTokenAddress(null);
  //     return;
  //   }
  //   try {
  //     const addr = (await publicClient.readContract({
  //       address: poolAddress as Address,
  //       abi: PoolAbi,
  //       functionName: "getPoolTokenAddress",
  //     })) as Address;
  //     setLpTokenAddress(addr);
  //   } catch (error) {
  //     console.error("Error fetching LP token address:", error);
  //     setLpTokenAddress(null);
  //   }
  // }, [poolAddress]);

  // useEffect(() => {
  //   fetchLpTokenAddress();
  // }, [fetchLpTokenAddress]);

  const fetchPoolSwapTokens = useCallback(async () => {
    if (!poolAddress) return;
    try {
      const [tA, tB] = (await publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolAbi,
        functionName: "getPoolSwapToken",
      })) as [Address, Address];
      console.log("Pool swap tokens:", tA, tB);
    } catch (error) {
      console.error("Error fetching pool swap tokens:", error);
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

      fetchReserves();
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
    await fetchReserves();
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

  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-background">
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border p-4 sm:p-8">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-[var(--color-primary)] tracking-tight">
          Somnia Swap
        </h1>
        <p className="text-base text-center mb-4 text-purple-500 font-medium">
          If a pool does not exist, please create one.
        </p>

        {poolAddress && (
          <p className="mb-4 text-base text-center font-semibold text-[var(--color-primary)]">
            {tokenA?.symbol} / {tokenB?.symbol}:{" "}
            <span className="font-mono">{reserves?.reserveA}</span> /{" "}
            <span className="font-mono">{reserves?.reserveB}</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          <div className="bg-muted rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-base font-semibold text-muted-foreground">
                From
              </label>
              <div className="text-sm text-muted-foreground font-mono">
                {tokenA ? tokenA.symbol : ""}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Select
                value={tokenA?.tokenAddress || ""}
                onValueChange={(val) => {
                  const selected = allTokens.find(
                    (t) => t.tokenAddress === val
                  );
                  if (selected) setTokenA(selected);
                }}
              >
                <SelectTrigger className="w-40 sm:w-56 h-10 text-base font-medium bg-card border border-border rounded-lg">
                  <SelectValue placeholder="Select Token A" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {allTokens.map((token) => (
                    <SelectItem
                      key={token.tokenAddress}
                      value={token.tokenAddress}
                      className="text-base"
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
                className="flex-1 h-10 text-lg font-mono bg-background border border-border rounded-lg px-3"
              />
            </div>
          </div>

          <div className="flex justify-center -my-2">
            <Button
              className="bg-accent text-accent-foreground rounded-full font-bold shadow hover:opacity-90 w-10 h-10 flex items-center justify-center"
              onClick={onSwitch}
              disabled={!tokenA || !tokenB}
              title="Switch tokens"
              size="icon"
            >
              <ArrowUpDown />
            </Button>
          </div>

          <div className="bg-muted rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <Label className="block text-base font-semibold text-muted-foreground">
                To
              </Label>
              <div className="text-sm text-muted-foreground font-mono">
                {tokenB ? tokenB.symbol : ""}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Select
                value={tokenB?.tokenAddress || ""}
                onValueChange={(val) => {
                  const selected = pairedToken.find(
                    (t) => t.tokenAddress === val
                  );
                  if (selected) setTokenB(selected);
                }}
                disabled={!tokenA || pairedToken.length === 0}
              >
                <SelectTrigger className="w-40 sm:w-56 h-10 text-base font-medium bg-card border border-border rounded-lg">
                  <SelectValue
                    placeholder={
                      tokenA
                        ? pairedToken.length
                          ? "Select Token B"
                          : "No paired tokens"
                        : "Select Token A first"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {pairedToken.map((token) => (
                    <SelectItem
                      key={token.tokenAddress}
                      value={token.tokenAddress}
                      className="text-base"
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
                value={amountOut}
                readOnly
                className="flex-1 h-10 text-lg font-mono bg-background border border-border rounded-lg px-3"
              />
              <div
                onClick={fetchQuote}
                aria-disabled={!poolAddress || !amountIn}
                className={`ml-2 text-base font-semibold text-primary px-2 py-1 rounded cursor-pointer select-none ${
                  !poolAddress || !amountIn
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-primary/10"
                }`}
              >
                Quote
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1 min-h-[1.25em]">
              {isFetching
                ? "Quoting..."
                : amountOut
                ? `Expected output ≈ ${amountOut} ${tokenB?.symbol ?? ""}`
                : ""}
            </div>
          </div>
        </div>

        {!!poolAddress && reserves && tokenA && tokenB && (
          <div className="mt-6 text-base text-muted-foreground space-y-1">
            {/* <div className="flex justify-between">
              <span className="font-semibold">Pool</span>
              <span className="font-mono">
                {poolAddress.slice(0, 8)}…{poolAddress.slice(-6)}
              </span>
            </div> */}
            <div className="flex justify-between">
              <span className="font-semibold">Fee</span>
              <span>0.5%</span>
            </div>
            {/* {lpTokenAddress && (
              <div className="flex justify-between">
                <span className="font-semibold">LP Token</span>
                <span className="font-mono">
                  {lpTokenAddress.slice(0, 8)}…{lpTokenAddress.slice(-6)}
                </span>
              </div>
            )} */}
            {lpBalance && (
              <div className="flex justify-between">
                <span className="font-semibold">Your LP Balance</span>
                <span className="font-mono">{lpBalance}</span>
              </div>
            )}
            {lpSupply && (
              <div className="flex justify-between">
                <span className="font-semibold">Total LP Supply</span>
                <span className="font-mono">{lpSupply}</span>
              </div>
            )}
          </div>
        )}

        <Button
          className="mt-8 w-full py-3 rounded-xl text-xl font-extrabold shadow hover:bg-primary/90 transition-all duration-200"
          onClick={onSwap}
        >
          {isApproving
            ? "Approving…"
            : isSwapping
            ? "Swapping…"
            : !poolAddress
            ? "Pool not found"
            : "Swap"}
        </Button>
      </div>
    </div>
  );
};

export default Swap;
