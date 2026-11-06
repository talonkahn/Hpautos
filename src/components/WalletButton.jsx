import React from 'react';
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';

export default function WalletButton({ className = '' }) {
  const { isConnected, shortAddress, wrongChain, openModal } = useWallet();
  return (
    <Button onClick={openModal} variant="outline"
      className={`gap-2 h-9 px-3 text-sm font-semibold border-amber-300 text-amber-700 hover:bg-amber-50 ${className}`}>
      <Wallet className="w-4 h-4" />
      {isConnected ? (
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${wrongChain ? 'bg-red-500' : 'bg-emerald-500'}`} />{shortAddress}
        </span>
      ) : 'Connect Wallet'}
    </Button>
  );
}
