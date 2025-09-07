import AddLiquidity from "@/components/AddLiquidity";
import CreatePool from "@/components/CreatePool";
import Header from "@/components/Header";
import PullLiquidity from "@/components/PullLiquidity";
import Swap from "@/components/Swap";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";
import { PoolAbi } from "@/contracts/abi/PoolAbi";
import { PoolManagerAbi } from "@/contracts/abi/PoolManagerAbi";
import { CONTRACT_ADDRESS, publicClient } from "@/utils/constant";
import type { ReserveState, TokenInfo } from "@/utils/types";
import React, { useCallback, useEffect, useState } from "react";
import { formatUnits, type Address } from "viem";

interface PoolProps {
  address: Address;
}

const Pool: React.FC<PoolProps> = ({ address }) => {
  const [poolAddress, setPoolAddress] = useState<Address | null>(null);
  const [lpBalance, setLpBalance] = useState<string>("0");
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [reserves, setReserves] = useState<ReserveState | null>(null);

  const fetchLpBalance = useCallback(async () => {
    if (!poolAddress) {
      setLpBalance("");
      return;
    }
    try {
      const balance = (await publicClient.readContract({
        address: poolAddress as Address,
        abi: PoolAbi,
        functionName: "getPoolTokenShare",
        args: [address],
      })) as bigint;
      setLpBalance(formatUnits(balance, 18));
    } catch (error) {
      console.error("Error fetching LP balance:", error);
      setLpBalance("");
    }
  }, [poolAddress, setLpBalance, address]);

  useEffect(() => {
    fetchLpBalance();
  }, [fetchLpBalance]);

  const fetchReserves = useCallback(async () => {
    if (!poolAddress || !tokenA || !tokenB) {
      setReserves(null);
      return;
    }
    try {
      const [reserveA, reserveB] = (await publicClient.readContract({
        address: poolAddress,
        abi: PoolAbi,
        functionName: "getPoolReserves",
      })) as [bigint, bigint];

      const tokenADecimals = Number(
        await publicClient.readContract({
          address: tokenA.tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
      );
      const tokenBDecimals = Number(
        await publicClient.readContract({
          address: tokenB.tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "decimals",
        })
      );

      const reserveAHuman = formatUnits(reserveA, tokenADecimals);
      const reserveBHuman = formatUnits(reserveB, tokenBDecimals);
      setReserves({ reserveA: reserveAHuman, reserveB: reserveBHuman });
    } catch (error) {
      console.error("Error fetching reserves:", error);
      setReserves(null);
    }
  }, [poolAddress, tokenA, tokenB]);

  useEffect(() => {
    fetchReserves();
  }, [fetchReserves]);

  const fetchPoolAddress = useCallback(async () => {
    if (!tokenA || !tokenB) {
      setPoolAddress(null);
      return;
    }
    try {
      const poolAddr = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "getPoolAddress",
        args: [tokenA.tokenAddress, tokenB.tokenAddress],
      });
      setPoolAddress(poolAddr as Address);
    } catch (error) {
      console.error("Error fetching pool address:", error);
    }
  }, [setPoolAddress, tokenA, tokenB]);

  useEffect(() => {
    fetchPoolAddress();
  }, [fetchPoolAddress]);
  return (
    <div className="w-full min-h-screen flex flex-col bg-background">
      <Header address={address} />
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div
          className="flex flex-row gap-4 items-center justify-end w-full"
          style={{
            flexWrap: "nowrap",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="shrink-0">
            <CreatePool />
          </div>
          {lpBalance > "0" && poolAddress && (
            <div className="shrink-0">
              <PullLiquidity
                poolAddress={poolAddress}
                address={address}
                lpBalance={lpBalance}
                fetchLpBalance={fetchLpBalance}
              />
            </div>
          )}
          {poolAddress && tokenA && tokenB && (
            <div className="shrink-0">
              <AddLiquidity
                tokenA={tokenA}
                tokenB={tokenB}
                poolAddress={poolAddress}
                accountAddress={address}
                fetchLpBalance={fetchLpBalance}
              />
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center w-full max-w-xl mx-auto px-2 sm:px-0">
          <Swap
            address={address}
            poolAddress={poolAddress}
            lpBalance={lpBalance}
            tokenA={tokenA}
            setTokenA={setTokenA}
            tokenB={tokenB}
            setTokenB={setTokenB}
            reserves={reserves}
            fetchReserves={fetchReserves}
          />
        </div>
      </div>
    </div>
  );
};

export default Pool;
