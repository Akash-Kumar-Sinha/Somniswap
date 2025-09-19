import AddLiquidity from "@/components/AddLiquidity";
import CreatePool from "@/components/CreatePool";
import Header from "@/components/Header";
import PullLiquidity from "@/components/PullLiquidity";
import Swap from "@/components/Swap";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";
import { PoolAbi } from "@/contracts/abi/PoolAbi";
import { PoolManagerAbi } from "@/contracts/abi/PoolManagerAbi";
import { POOL_MANAGER_ADDRESS, publicClient } from "@/utils/constant";
import type { ReserveState, TokenInfo } from "@/utils/types";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { formatUnits, type Address } from "viem";
import { NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, Rocket } from "lucide-react";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { gsap } from "gsap";

interface PoolProps {
  address: Address;
}

const Pool: React.FC<PoolProps> = ({ address }) => {
  const [poolAddress, setPoolAddress] = useState<Address | null>(null);
  const [lpBalance, setLpBalance] = useState<string>("0");
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [reserves, setReserves] = useState<ReserveState | null>(null);
  const [allTokens, setAllTokens] = useState<TokenInfo[]>([]);
  const [lpSupply, setLpSupply] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLButtonElement>(null);
  const swapContainerRef = useRef<HTMLDivElement>(null);
  const backgroundElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
      .fromTo(
        actionsButtonRef.current,
        { opacity: 0, scale: 0.9, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      )
      .fromTo(
        swapContainerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        "-=0.3"
      );

    backgroundElementsRef.current.forEach((el) => {
      if (el) {
        gsap.set(el, {
          x: Math.random() * 100 + "%",
          y: Math.random() * 100 + "%",
        });

        gsap.to(el, {
          y: "+=20",
          x: "+=10",
          rotation: 360,
          duration: 8 + Math.random() * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: Math.random() * 2,
        });
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

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
        address: POOL_MANAGER_ADDRESS,
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

  const getAllTokens = async () => {
    try {
      const tokens = (await publicClient.readContract({
        address: POOL_MANAGER_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "getAllTokens",
      })) as TokenInfo[];
      setAllTokens(tokens);
    } catch (error) {
      console.error("Error fetching all tokens:", error);
    }
  };

  useEffect(() => {
    getAllTokens();
  }, []);

  const fetchLpSupply = useCallback(async () => {
    if (!poolAddress) {
      setLpSupply("");
      return;
    }
    try {
      const supply = (await publicClient.readContract({
        address: poolAddress,
        abi: PoolAbi,
        functionName: "getPoolTokenSupply",
      })) as bigint;
      setLpSupply(formatUnits(supply, 18));
    } catch (error) {
      console.error("Error fetching LP supply:", error);
      setLpSupply("");
    }
  }, [poolAddress]);

  useEffect(() => {
    fetchLpSupply();
  }, [fetchLpSupply]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse"></div>

        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (backgroundElementsRef.current) {
                backgroundElementsRef.current[i] = el;
              }
            }}
            className="absolute w-4 h-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-sm"
          />
        ))}
      </div>

      <Header address={address} />

      <div className="relative z-10 w-full px-4 py-8 border-b border-border/50 backdrop-blur-sm">
        <div className="flex justify-center sm:justify-end mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                ref={actionsButtonRef}
                className="group relative w-full max-w-xs sm:w-auto font-bold flex items-center justify-center gap-3 px-8 py-4 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[56px] active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground backdrop-blur-sm border border-primary/30"
                onMouseEnter={() => {
                  gsap.to(actionsButtonRef.current, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: "power2.out",
                  });
                }}
                onMouseLeave={() => {
                  gsap.to(actionsButtonRef.current, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out",
                  });
                }}
              >
                <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-bold">Pool Actions</span>
                <ChevronDown className="h-4 w-4 transition-transform duration-300 ui-open:rotate-180" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-64 p-2 mx-4 sm:mx-0 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl"
              align="center"
              sideOffset={8}
            >
              <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                Pool Management
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                className="p-0 focus:bg-transparent"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="w-full px-3 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
                  <CreatePool getAllTokens={getAllTokens} />
                </div>
              </DropdownMenuItem>

              {((poolAddress && tokenA && tokenB) ||
                (lpBalance > "0" && poolAddress)) && (
                <>
                  <DropdownMenuSeparator className="my-3" />
                  <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                    Liquidity
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />

                  <div className="flex gap-1 px-1">
                    {poolAddress && tokenA && tokenB && (
                      <DropdownMenuItem
                        className="p-0 focus:bg-transparent flex-1"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="w-full px-2 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors text-center">
                          <AddLiquidity
                            tokenA={tokenA}
                            tokenB={tokenB}
                            poolAddress={poolAddress}
                            accountAddress={address}
                            fetchLpBalance={fetchLpBalance}
                            fetchReserves={fetchReserves}
                            fetchLpSupply={fetchLpSupply}
                          />
                        </div>
                      </DropdownMenuItem>
                    )}

                    {lpBalance > "0" && poolAddress && (
                      <DropdownMenuItem
                        className="p-0 focus:bg-transparent flex-1"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="w-full px-2 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors text-center">
                          <PullLiquidity
                            poolAddress={poolAddress}
                            address={address}
                            lpBalance={lpBalance}
                            fetchLpBalance={fetchLpBalance}
                            getAllTokens={getAllTokens}
                            fetchReserves={fetchReserves}
                          />
                        </div>
                      </DropdownMenuItem>
                    )}
                  </div>
                </>
              )}

              <DropdownMenuSeparator className="m-0 mt-3" />
              <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                Launch
              </DropdownMenuLabel>

              <DropdownMenuItem className="p-0 focus:bg-transparent">
                <div className="w-full h-full min-h-[44px] rounded-md hover:bg-muted cursor-pointer transition-colors flex items-center">
                  <NavLink
                    to="/token-launch"
                    className="flex items-center gap-3 w-full min-h-[44px] px-3 py-2 rounded-md hover:bg-muted cursor-pointer text-primary"
                  >
                    <Rocket className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">Launch Your Token</span>
                  </NavLink>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          ref={swapContainerRef}
          className="flex-1 flex items-center justify-center w-full px-4 py-8"
        >
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
            allTokens={allTokens}
            lpSupply={lpSupply}
          />
        </div>
      </div>
    </div>
  );
};

export default Pool;
