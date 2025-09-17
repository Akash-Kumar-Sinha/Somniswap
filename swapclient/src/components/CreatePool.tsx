import { useState } from "react";
import {
  POOL_MANAGER_ADDRESS,
  publicClient,
  walletClient,
} from "@/utils/constant";
import { PoolManagerAbi } from "@/contracts/abi/PoolManagerAbi";
import { ERC20_ABI } from "@/contracts/abi/ERC20Abi";

import { Button } from "./ui/button";
import { PlusSquare, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import type { TokenInfo } from "@/utils/types";
import type { Address } from "viem";
import { toast } from "sonner";

interface CreatePoolProps {
  getAllTokens: () => Promise<void>;
}

const CreatePool = ({ getAllTokens }: CreatePoolProps) => {
  const [open, setOpen] = useState(false);
  const [tokenALoading, setTokenALoading] = useState(false);
  const [tokenBLoading, setTokenBLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingStep, setCreatingStep] = useState("");
  const [tokenA, setTokenA] = useState<TokenInfo>({
    name: "",
    symbol: "",
    tokenAddress: "",
  });
  const [tokenB, setTokenB] = useState<TokenInfo>({
    name: "",
    symbol: "",
    tokenAddress: "",
  });

  async function getTokenMetadata(tokenAddress: Address) {
    try {
      const name = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "name",
      });
      const symbol = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      });
      return { name: String(name), symbol: String(symbol) };
    } catch (err) {
      console.error("Error fetching metadata:", err);
      return { name: "", symbol: "" };
    }
  }

  const handleAddressChange = async (which: "A" | "B", address: string) => {
    if (!address.startsWith("0x") || address.length !== 42) {
      if (which === "A") {
        setTokenA({ name: "", symbol: "", tokenAddress: address });
      } else {
        setTokenB({ name: "", symbol: "", tokenAddress: address });
      }
      return;
    }

    if (which === "A") setTokenALoading(true);
    else setTokenBLoading(true);

    const { name, symbol } = await getTokenMetadata(address as Address);

    if (which === "A") {
      setTokenA({ name, symbol, tokenAddress: address });
      setTokenALoading(false);
    } else {
      setTokenB({ name, symbol, tokenAddress: address });
      setTokenBLoading(false);
    }
  };

  const createPool = async () => {
    try {
      if (!tokenA.tokenAddress || !tokenB.tokenAddress) {
        toast.error("Please provide both token addresses");
        return;
      }

      if (!tokenA.name || !tokenB.name || !tokenA.symbol || !tokenB.symbol) {
        toast.error("Please wait for token metadata to load");
        return;
      }

      setCreating(true);
      setCreatingStep("Preparing pool creation...");
      toast.info("Creating pool...");

      const [account] = await walletClient.getAddresses();

      setCreatingStep("Submitting transaction...");
      const hash = await walletClient.writeContract({
        address: POOL_MANAGER_ADDRESS,
        abi: PoolManagerAbi,
        functionName: "createPool",
        args: [
          tokenA.name,
          tokenA.symbol,
          tokenA.tokenAddress,
          tokenB.name,
          tokenB.symbol,
          tokenB.tokenAddress,
        ],
        account,
      });

      setCreatingStep("Confirming transaction...");
      toast.info("Transaction submitted...");

      await publicClient.waitForTransactionReceipt({ hash });

      setOpen(false);
      toast.success(
        `Pool created successfully for ${tokenA.symbol}/${tokenB.symbol}`
      );

      setTokenA({ name: "", symbol: "", tokenAddress: "" });
      setTokenB({ name: "", symbol: "", tokenAddress: "" });

      await getAllTokens();
    } catch (err) {
      console.error("CreatePool error:", err);
      toast.error("Failed to create pool");
    } finally {
      setCreating(false);
      setCreatingStep("");
    }
  };

  const isValidAddress = (address: string) => {
    return address.startsWith("0x") && address.length === 42;
  };

  const isTokenAValid =
    isValidAddress(tokenA.tokenAddress) && tokenA.name && tokenA.symbol;
  const isTokenBValid =
    isValidAddress(tokenB.tokenAddress) && tokenB.name && tokenB.symbol;
  const canCreate =
    isTokenAValid &&
    isTokenBValid &&
    !tokenALoading &&
    !tokenBLoading &&
    !creating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild >
        <Button className="w-full font-semibold flex items-center justify-center gap-2 px-4 py-3 text-sm sm:text-base rounded-lg shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusSquare className="w-5 h-5 text-primary-foreground" />
          <span className="hidden xs:inline">Create Pool</span>
          <span className="inline xs:hidden">Create</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-2xl mx-auto p-0 rounded-xl border-0 shadow-2xl overflow-hidden bg-card text-card-foreground">
        <div className=" px-6 py-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
              <PlusSquare className="w-6 h-6 text-primary" />
              Create New Pool
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Enter valid token contract addresses. Token names and symbols will
              be automatically fetched.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-foreground">Token A</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Contract Address
                  </label>
                  <Input
                    placeholder="0x1234...abcd"
                    value={tokenA.tokenAddress}
                    onChange={(e) => handleAddressChange("A", e.target.value)}
                    className={`h-12 text-base border-2 transition-all duration-200 ${
                      tokenA.tokenAddress &&
                      !isValidAddress(tokenA.tokenAddress)
                        ? "border-destructive focus:border-destructive bg-destructive/10"
                        : isTokenAValid
                        ? "border-green-400 focus:border-green-600 bg-green-50"
                        : "border-border focus:border-primary hover:border-border/80"
                    }`}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Token Name
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Automatically fetched..."
                      value={tokenA.name}
                      readOnly
                      className="h-12 text-base bg-muted border-border"
                    />
                    {tokenALoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!tokenALoading && tokenA.name && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Token Symbol
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Automatically fetched..."
                      value={tokenA.symbol}
                      readOnly
                      className="h-12 text-base bg-muted border-border"
                    />
                    {tokenALoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!tokenALoading && tokenA.symbol && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          {tokenA.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="font-semibold text-foreground">Token B</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Contract Address
                  </label>
                  <Input
                    placeholder="0x1234...abcd"
                    value={tokenB.tokenAddress}
                    onChange={(e) => handleAddressChange("B", e.target.value)}
                    className={`h-12 text-base border-2 transition-all duration-200 ${
                      tokenB.tokenAddress &&
                      !isValidAddress(tokenB.tokenAddress)
                        ? "border-destructive focus:border-destructive bg-destructive/10"
                        : isTokenBValid
                        ? "border-green-400 focus:border-green-600 bg-green-50"
                        : "border-border focus:border-primary hover:border-border/80"
                    }`}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Token Name
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Automatically fetched..."
                      value={tokenB.name}
                      readOnly
                      className="h-12 text-base bg-muted border-border"
                    />
                    {tokenBLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!tokenBLoading && tokenB.name && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Token Symbol
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Automatically fetched..."
                      value={tokenB.symbol}
                      readOnly
                      className="h-12 text-base bg-muted border-border"
                    />
                    {tokenBLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!tokenBLoading && tokenB.symbol && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          {tokenB.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isTokenAValid && isTokenBValid && (
            <div className="bg-green-50 border border-green-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    Pool Preview
                  </p>
                  <p className="text-xs text-green-700">
                    Creating pool for {tokenA.symbol} / {tokenB.symbol} pair
                  </p>
                </div>
              </div>
            </div>
          )}

          {(tokenA.tokenAddress && !isValidAddress(tokenA.tokenAddress)) ||
          (tokenB.tokenAddress && !isValidAddress(tokenB.tokenAddress)) ? (
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
                    Invalid Address Format
                  </p>
                  <p className="text-xs text-destructive">
                    Please enter valid Ethereum addresses starting with '0x' and
                    42 characters long.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {creating && creatingStep && (
            <div className="bg-accent/10 border border-accent rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-accent mb-1">
                    Creating Pool
                  </p>
                  <p className="text-xs text-accent">{creatingStep}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-card">
          <Button
            onClick={createPool}
            disabled={!canCreate}
            className="w-full h-12 font-semibold text-base rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {creating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{creatingStep || "Creating Pool..."}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <PlusSquare className="w-5 h-5" />
                <span>Create Pool</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePool;
