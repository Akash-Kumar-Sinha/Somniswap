import { Badge } from "./ui/badge";
import { Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { Address } from "viem";

interface HeaderProps {
  address: Address;
}

const Header = ({ address }: HeaderProps) => {
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
    }
  };

  return (
    <header
      className="w-full sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur flex items-center justify-between px-4 sm:px-8 py-2 sm:py-3 shadow-md"
      style={{ minHeight: 64 }}
    >
      <div className="flex items-center gap-3">
        <img
          src="/somnia.svg"
          alt="Somnia Logo"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow"
          style={{ background: "var(--color-card)" }}
        />
        <span className="text-xl sm:text-2xl font-extrabold tracking-wide text-[var(--color-primary)] drop-shadow-sm">
          Somnia Swap
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              onClick={copyAddress}
              className="cursor-pointer font-mono px-3 py-1 rounded-xl shadow border border-[var(--color-border)] text-sm bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-80 transition"
            >
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Not Connected"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-1">
            <Copy className="w-4 h-4" />
            <span className="font-mono">{address}</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default Header;
