import * as React from "react";
import { TokenLanuncherAbi } from "@/contracts/abi/TokenLanuncherAbi";
import {
  publicClient,
  TOKEN_LAUNCHER_ADDRESS,
  walletClient,
} from "@/utils/constant";
import { parseAbiItem, type Address } from "viem";
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
import { Rocket, Coins, ExternalLink, Copy, CheckCircle } from "lucide-react";

const TokenLaunchPanel = () => {
  const [name, setName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [initialSupply, setInitialSupply] = React.useState(0);
  const [mintTokenAddress, setMintTokenAddress] = React.useState<Address>();
  const [mintAmount, setMintAmount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [mintLoading, setMintLoading] = React.useState(false);

  const [launchedTokenAddress, setLaunchedTokenAddress] = React.useState("");
  const [launchedTokenInfo, setLaunchedTokenInfo] = React.useState<{
    name: string;
    symbol: string;
    supply: string;
  } | null>(null);
  const [mintedTokenAddress, setMintedTokenAddress] = React.useState("");
  const [mintedAmount, setMintedAmount] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [mintCopied, setMintCopied] = React.useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const copyMintAddressToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMintCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setMintCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleLaunchToken = async () => {
    if (!name || !symbol || initialSupply <= 0) {
      toast.error("Please fill all fields with valid values.");
      return;
    }
    setLoading(true);

    setLaunchedTokenAddress("");
    setLaunchedTokenInfo(null);
    try {
      const [userAddress] = await walletClient.getAddresses();
      if (!userAddress) {
        toast.error("Wallet not connected");
        setLoading(false);
        return;
      }
      const walletAddress = userAddress as Address;
      toast("Launching token...", { description: `${name} (${symbol})` });

      const txHash = await walletClient.writeContract({
        address: TOKEN_LAUNCHER_ADDRESS as Address,
        abi: TokenLanuncherAbi,
        functionName: "launchToken",
        args: [name, symbol, initialSupply],
        account: walletAddress as Address,
        chain: walletClient.chain,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      try {
        const logs = await publicClient.getLogs({
          address: TOKEN_LAUNCHER_ADDRESS as Address,
          event: parseAbiItem(
            "event TokenLaunched(address indexed token, string name, string symbol, uint256 initialSupply, address indexed owner)"
          ),
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
        });

        if (logs.length > 0) {
          const log = logs[0];

          const newTokenAddress = log.args?.token;
          const tokenName = log.args?.name || name;
          const tokenSymbol = log.args?.symbol || symbol;
          const tokenSupply = log.args?.initialSupply || initialSupply;

          if (newTokenAddress) {
            setLaunchedTokenAddress(newTokenAddress as string);
            setLaunchedTokenInfo({
              name: tokenName as string,
              symbol: tokenSymbol as string,
              supply: tokenSupply?.toString() || initialSupply.toString(),
            });
          }
        }
      } catch {
        /* Continue with success toast even if event parsing fails */
      }

      toast.success("Token launched successfully!", {
        description: (
          <div className="space-y-2 text-foreground">
            <div>
              Token: {name} ({symbol})
            </div>
            <div>
              View transaction:{" "}
              <a
                className="underline text-primary hover:text-primary/80"
                href={`https://dreamscan.somnia.network/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {txHash?.toString().slice(0, 10)}...
              </a>
            </div>
          </div>
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

    setMintedTokenAddress("");
    setMintedAmount("");
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
        chain: walletClient.chain,
      });

      setMintedTokenAddress(mintTokenAddress as string);
      setMintedAmount(mintAmount.toString());

      toast.success("Tokens minted successfully!", {
        description: (
          <div className="space-y-2 text-foreground">
            <div>Amount: {mintAmount} tokens</div>
            <div>
              View transaction:{" "}
              <a
                className="underline text-primary hover:text-primary/80"
                href={`https://dreamscan.somnia.network/tx/${tx}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tx?.toString().slice(0, 10)}...
              </a>
            </div>
          </div>
        ),
      });
      setMintTokenAddress(undefined);
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
              Deploy new ERC20 tokens or mint additional supply of tokens on
              Somnia Network{" "}
              <span className="text-yellow-600">(Test purpose only)</span>
            </p>
          </div>
        </div>

        {/* Display launched token info */}
        {launchedTokenAddress && launchedTokenInfo && (
          <Card className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 rounded-3xl shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
                    Token Launched Successfully!
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    {launchedTokenInfo.name} ({launchedTokenInfo.symbol}) -
                    Supply: {launchedTokenInfo.supply}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-2xl border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Contract Address
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {launchedTokenAddress}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(launchedTokenAddress)}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://dreamscan.somnia.network/address/${launchedTokenAddress}`,
                        "_blank"
                      )
                    }
                    className="shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Display minted token info */}
        {mintedTokenAddress && mintedAmount && (
          <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 rounded-3xl shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Coins className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    Tokens Minted Successfully!
                  </CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400">
                    {mintedAmount} tokens minted
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-2xl border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Token Contract Address
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {mintedTokenAddress}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyMintAddressToClipboard(mintedTokenAddress)
                    }
                    className="shrink-0"
                  >
                    {mintCopied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://dreamscan.somnia.network/address/${mintedTokenAddress}`,
                        "_blank"
                      )
                    }
                    className="shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                      onChange={(e) =>
                        setMintTokenAddress(e.target.value as Address)
                      }
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
