import { PoolManagerAbi } from "@/contracts/abi/PoolManagerAbi";
import { CONTRACT_ADDRESS, publicClient } from "@/utils/constant";
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

type TokenInfo = {
  name: string;
  symbol: string;
  tokenAddress: string;
};

const Swap = () => {
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [pairedToken, setPairedToken] = useState<TokenInfo[]>([]);
  const [allTokens, setAllTokens] = useState<TokenInfo[]>([]);

  const fetchAllTokens = async () => {
    try {
      const tokens = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "getAllTokens",
      })) as TokenInfo[];

      const formatted: TokenInfo[] = tokens.map((t) => ({
        name: t.name,
        symbol: t.symbol,
        tokenAddress: t.tokenAddress,
      }));

      setAllTokens(formatted);
    } catch (err) {
      toast.error("Failed to fetch tokens");
      console.error(err);
    }
  };

  const fetchPairedToken = useCallback(async () => {
    if (!tokenA) return;
    try {
      const paired = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "getPairedTokenInfobyAddress",
        args: [tokenA.tokenAddress],
      })) as TokenInfo[];

      const formatted: TokenInfo[] = paired.map((t) => ({
        name: t.name,
        symbol: t.symbol,
        tokenAddress: t.tokenAddress,
      }));
      setPairedToken(formatted);
    } catch (err) {
      toast.error("Failed to fetch paired token");
      console.error(err);
    }
  }, [tokenA]);

  useEffect(() => {
    fetchAllTokens();
  }, []);

  useEffect(() => {
    fetchPairedToken();
    setTokenB(null);
  }, [tokenA, fetchPairedToken]);

  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-background">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">
          Somnia Swap
        </h1>
        <p className="text-sm text-center mb-2 text-purple-500">
          If pool does not exist, please create one.
        </p>
        <div className="flex flex-col gap-4">
          <div className="bg-muted rounded-xl p-4 flex flex-col gap-2">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              From
            </label>
            <Select
              value={tokenA?.tokenAddress || ""}
              onValueChange={(val) => {
                const selected = allTokens.find((t) => t.tokenAddress === val);
                if (selected) setTokenA(selected);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Token A" />
              </SelectTrigger>
              <SelectContent>
                {allTokens.map((token) => (
                  <SelectItem
                    key={token.tokenAddress}
                    value={token.tokenAddress}
                  >
                    {token.name} ({token.symbol}) —{" "}
                    {token.tokenAddress.slice(0, 6)}...
                    {token.tokenAddress.slice(-4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center">
            <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 font-bold shadow">
              ↓
            </span>
          </div>
          <div className="bg-muted rounded-xl p-4 flex flex-col gap-2">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              To
            </label>
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
              <SelectTrigger className="w-full">
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
              <SelectContent>
                {pairedToken.map((token) => (
                  <SelectItem
                    key={token.tokenAddress}
                    value={token.tokenAddress}
                  >
                    {token.name} ({token.symbol}) —{" "}
                    {token.tokenAddress.slice(0, 6)}...
                    {token.tokenAddress.slice(-4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {tokenA && tokenB && (
          <div className="mt-4 w-full">
            <h2 className="text-lg font-bold">Selected Pair</h2>
            <p>
              {tokenA.name} ({tokenA.symbol}) → {tokenB.name} ({tokenB.symbol})
            </p>
          </div>
        )}
        <Button
          className="mt-6 w-full py-3 rounded-xl text-lg font-bold shadow hover:bg-primary/90 transition-all duration-200"
          disabled={!tokenA || !tokenB}
        >
          Swap
        </Button>
      </div>
    </div>
  );
};

export default Swap;
