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
    <header className="w-full sticky top-0 z-50 border-b-2 border-primary rounded-xl shadow-lg flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-wide">Somnia Swap</span>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              onClick={copyAddress}
              className="cursor-pointer font-mono px-3 py-1 rounded-xl shadow border text-sm tw-animate-fade-in var(--color-primary) var(--color-primary-foreground) var(--color-border transform 0.3s cubic-bezier(.4,0,.2,1)"
            >
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Not Connected"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-1">
            <Copy className="w-4 h-4" />
            <span>{address}</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default Header;
