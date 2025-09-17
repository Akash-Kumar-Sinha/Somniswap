import * as React from "react";
import { TokenLanuncherAbi } from "@/contracts/abi/TokenLanuncherAbi";
import { TOKEN_LAUNCHER_ADDRESS, walletClient } from "@/utils/constant";
import type { Address } from "viem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Rocket,
  Coins,
  ExternalLink,
} from "lucide-react";

const TokenLaunchPanel = () => {
  const [name, setName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [initialSupply, setInitialSupply] = React.useState(0);
  const [mintTokenAddress, setMintTokenAddress] = React.useState("");
  const [mintAmount, setMintAmount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [mintLoading, setMintLoading] = React.useState(false);

  const handleLaunchToken = async () => {
    if (!name || !symbol || initialSupply <= 0) {
      toast.error("Please fill all fields with valid values.");
      return;
    }
    setLoading(true);
    try {
      const [userAddress] = await walletClient.getAddresses();
      if (!userAddress) {
        toast.error("Wallet not connected");
        setLoading(false);
        return;
      }
      const walletAddress = userAddress as Address;
      toast("Launching token...", { description: `${name} (${symbol})` });
      const tx = await walletClient.writeContract({
        address: TOKEN_LAUNCHER_ADDRESS as Address,
        abi: TokenLanuncherAbi,
        functionName: "launchToken",
        args: [name, symbol, initialSupply],
        account: walletAddress as Address,
      });
      toast.success("Token launch transaction sent!", {
        description: (
          <span>
            View on explorer:{" "}
            <a
              className="underline text-primary"
              href={`https://dreamscan.somnia.network/tx/${tx}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tx?.toString().slice(0, 10)}...
            </a>
          </span>
        ),
      });
      setName("");
      setSymbol("");
      setInitialSupply(0);
    } catch (error: unknown) {
      toast.error("Error launching token", {
        description: (error as Error)?.message || String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!mintTokenAddress || mintAmount <= 0) {
      toast.error("Please provide a valid token address and amount.");
      return;
    }
    setMintLoading(true);
    try {
      const [userAddress] = await walletClient.getAddresses();
      if (!userAddress) {
        toast.error("Wallet not connected");
        setMintLoading(false);
        return;
      }
      const walletAddress = userAddress as Address;
      toast("Minting tokens...", { description: `Token: ${mintTokenAddress}` });
      const tx = await walletClient.writeContract({
        address: TOKEN_LAUNCHER_ADDRESS as Address,
        abi: TokenLanuncherAbi,
        functionName: "mintExistingToken",
        args: [mintTokenAddress as Address, mintAmount],
        account: walletAddress as Address,
      });
      toast.success("Mint transaction sent!", {
        description: (
          <span>
            View on explorer:{" "}
            <a
              className="underline text-primary"
              href={`https://dreamscan.somnia.network/tx/${tx}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tx?.toString().slice(0, 10)}...
            </a>
          </span>
        ),
      });
      setMintTokenAddress("");
      setMintAmount(0);
    } catch (error: unknown) {
      toast.error("Error minting token", {
        description: (error as Error)?.message || String(error),
      });
    } finally {
      setMintLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-background)] flex items-center justify-center p-3">
      <div className="relative z-10 w-full max-w-2xl border rounded-2xl p-8">
        <div className="text-center mb-8 space-y-4">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black text-[var(--color-primary)] leading-tight">
              Token Launcher
            </h1>
            <p className="text-lg text-[var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed font-medium">
              Deploy new ERC20 tokens or mint additional supply of tokens on Somnia Network <span className="text-yellow-600">(Test purpose only)</span>
            </p>
          </div>
       </div>

        <Tabs defaultValue="launch" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-[var(--color-card)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-2 h-14 shadow-lg">
            <TabsTrigger
              value="launch"
              className="rounded-xl text-sm font-bold transition-all duration-300 data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-[var(--color-primary-foreground)] data-[state=active]:shadow-lg hover:bg-[var(--color-muted)] flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Launch Token
            </TabsTrigger>
            <TabsTrigger
              value="mint"
              className="rounded-xl text-sm font-bold transition-all duration-300 data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-[var(--color-primary-foreground)] data-[state=active]:shadow-lg hover:bg-[var(--color-muted)] flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Mint Tokens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="launch" className="mt-0">
            <Card className="bg-[var(--color-card)] backdrop-blur-xl border border-[var(--color-border)] rounded-3xl shadow-2xl">
              <CardHeader className="pb-6 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[var(--color-primary)] rounded-xl flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-[var(--color-primary-foreground)]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-[var(--color-foreground)]">
                      Launch New Token
                    </CardTitle>
                    <CardDescription className="text-base text-[var(--color-muted-foreground)] mt-1">
                      Deploy a custom ERC20 token with your specifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label
                      htmlFor="token-name"
                      className="text-sm font-bold text-[var(--color-foreground)] uppercase tracking-wide"
                    >
                      Token Name
                    </Label>
                    <Input
                      id="token-name"
                      placeholder="e.g. My Awesome Token"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-[var(--color-input)] text-[var(--color-foreground)] h-12 rounded-2xl border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/20 transition-all duration-200 text-base font-medium placeholder:text-[var(--color-muted-foreground)]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="token-symbol"
                      className="text-sm font-bold text-[var(--color-foreground)] uppercase tracking-wide"
                    >
                      Token Symbol
                    </Label>
                    <Input
                      id="token-symbol"
                      placeholder="e.g. MAT"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="bg-[var(--color-input)] text-[var(--color-foreground)] h-12 rounded-2xl border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/20 transition-all duration-200 text-base font-medium placeholder:text-[var(--color-muted-foreground)] uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="initial-supply"
                    className="text-sm font-bold text-[var(--color-foreground)] uppercase tracking-wide"
                  >
                    Initial Supply
                  </Label>
                  <Input
                    id="initial-supply"
                    type="number"
                    min={1}
                    placeholder="e.g. 1,000,000"
                    value={initialSupply || ""}
                    onChange={(e) => setInitialSupply(Number(e.target.value))}
                    className="bg-[var(--color-input)] text-[var(--color-foreground)] h-12 rounded-2xl border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/20 transition-all duration-200 text-base font-medium placeholder:text-[var(--color-muted-foreground)]"
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-6 pb-6 px-6">
                <Button
                  onClick={handleLaunchToken}
                  disabled={loading}
                  className="w-full h-12 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-[var(--color-primary-foreground)] rounded-2xl font-bold text-base transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-[var(--color-primary-foreground)]/30 border-t-[var(--color-primary-foreground)] rounded-full animate-spin"></div>
                      Launching Token...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Rocket className="w-5 h-5" />
                      Launch Token
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="mint" className="mt-0">
            <Card className="bg-[var(--color-card)] backdrop-blur-xl border border-[var(--color-border)] rounded-3xl shadow-2xl">
              <CardHeader className="pb-6 pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[var(--color-primary)] rounded-xl flex items-center justify-center">
                    <Coins className="w-4 h-4 text-[var(--color-primary-foreground)]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-[var(--color-foreground)]">
                      Mint Existing Token
                    </CardTitle>
                    <CardDescription className="text-base text-[var(--color-muted-foreground)] mt-1">
                      Add more supply to your existing ERC20 token
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="mint-token-address"
                    className="text-sm font-bold text-[var(--color-foreground)] uppercase tracking-wide"
                  >
                    Token Contract Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="mint-token-address"
                      placeholder="0x1234567890abcdef..."
                      value={mintTokenAddress}
                      onChange={(e) => setMintTokenAddress(e.target.value)}
                      className="bg-[var(--color-input)] text-[var(--color-foreground)] h-12 rounded-2xl border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/20 transition-all duration-200 text-base font-mono placeholder:text-[var(--color-muted-foreground)] pr-12"
                    />
                    {mintTokenAddress && (
                      <button
                        onClick={() =>
                          window.open(
                            `https://dreamscan.somnia.network/address/${mintTokenAddress}`,
                            "_blank"
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-[var(--color-muted)] rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="mint-amount"
                    className="text-sm font-bold text-[var(--color-foreground)] uppercase tracking-wide"
                  >
                    Amount to Mint
                  </Label>
                  <Input
                    id="mint-amount"
                    type="number"
                    min={1}
                    placeholder="e.g. 10,000"
                    value={mintAmount || ""}
                    onChange={(e) => setMintAmount(Number(e.target.value))}
                    className="bg-[var(--color-input)] text-[var(--color-foreground)] h-12 rounded-2xl border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-primary)]/20 transition-all duration-200 text-base font-medium placeholder:text-[var(--color-muted-foreground)]"
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-6 pb-6 px-6">
                <Button
                  onClick={handleMint}
                  disabled={mintLoading}
                  className="w-full h-12 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-[var(--color-primary-foreground)] rounded-2xl font-bold text-base transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {mintLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-[var(--color-primary-foreground)]/30 border-t-[var(--color-primary-foreground)] rounded-full animate-spin"></div>
                      Minting Tokens...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Coins className="w-5 h-5" />
                      Mint Tokens
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TokenLaunchPanel;
