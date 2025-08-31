import CreatePool from "@/components/CreatePool";
import Header from "@/components/Header";
import Swap from "@/components/Swap";
import React from "react";

interface PoolProps {
  address: string;
}

const Pool: React.FC<PoolProps> = ({ address }) => {
  return (
    <div className="w-full flex h-full flex-col">
      <Header address={address} />
      <div className="relative w-full p-12">
        <div className="fixed top-24 right-8">
          <CreatePool />
        </div>
      </div>

      <Swap />
    </div>
  );
};

export default Pool;
