import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, ExternalLink, LogOut, AlertTriangle } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import { chain, explorerAddress } from '@/lib/web3';

// Wallets we can't detect (not installed / on mobile) → install link or "open this site inside the wallet app"
const here = () => window.location.href;
const GET_WALLETS = [
  { name: 'MetaMask',        icon: '🦊', rdns: 'io.metamask',          install: 'https://metamask.io/download/',            open: () => `https://metamask.app.link/dapp/${here().replace(/^https?:\/\//, '')}` },
  { name: 'Coinbase Wallet', icon: '🔵', rdns: 'com.coinbase.wallet',  install: 'https://www.coinbase.com/wallet/downloads', open: () => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(here())}` },
  { name: 'Trust Wallet',    icon: '🛡️', rdns: 'com.trustwallet.app',  install: 'https://trustwallet.com/download',          open: () => `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(here())}` },
  { name: 'Exodus',          icon: '🌌', rdns: 'com.exodus.web3-wallet', install: 'https://www.exodus.com/download/',        open: null },
  { name: 'Bitget Wallet',   icon: '⚡', rdns: 'com.bitget.web3',      install: 'https://web3.bitget.com/en/wallet-download', open: null },
];

export default function WalletModal() {
  const { modalOpen, closeModal, wallets, connect, connecting, address, active, disconnect, wrongChain, ensureChain, shortAddress } = useWallet();

  const detectedRdns = new Set(wallets.map((w) => w.info.rdns));
  const notDetected = GET_WALLETS.filter((g) => !detectedRdns.has(g.rdns));

  return (
    <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <DialogTitle className="text-white flex items-center gap-2 text-lg"><Wallet className="w-5 h-5 text-amber-400" />Connect Wallet</DialogTitle>
          <p className="text-slate-400 text-xs mt-1">Network: {chain.name}{chain.testnet ? ' (testnet — no real money)' : ''}</p>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {address ? (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs text-emerald-700 font-semibold">Connected with {active?.info?.name}</p>
                <a href={explorerAddress(address)} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-slate-800 break-all hover:underline inline-flex items-center gap-1">
                  {address} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              {wrongChain && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-800">Your wallet is on the wrong network. Switch to {chain.name} to continue.</p>
                    <Button size="sm" onClick={ensureChain} className="mt-2 bg-amber-500 hover:bg-amber-600 text-white h-8">Switch to {chain.name}</Button>
                  </div>
                </div>
              )}
              <Button variant="outline" onClick={() => { disconnect(); closeModal(); }} className="w-full gap-2"><LogOut className="w-4 h-4" />Disconnect {shortAddress}</Button>
            </div>
          ) : (
            <>
              {wallets.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detected on this device</p>
                  {wallets.map((w) => (
                    <button key={w.info.uuid} disabled={connecting} onClick={() => connect(w)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left">
                      {w.info.icon ? <img src={w.info.icon} alt="" className="w-9 h-9 rounded-lg" /> : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">👛</div>}
                      <span className="font-semibold text-slate-900 flex-1">{w.info.name}</span>
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <span className="text-xs text-amber-600 font-semibold">Connect</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
                  No wallet detected in this browser. On mobile, open this site inside your wallet app's browser using the buttons below. On desktop, install a wallet extension.
                </div>
              )}

              {notDetected.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Get a wallet / open in app</p>
                  <div className="grid grid-cols-1 gap-2">
                    {notDetected.map((g) => (
                      <div key={g.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xl w-9 text-center">{g.icon}</span>
                        <span className="text-sm font-medium text-slate-800 flex-1">{g.name}</span>
                        {g.open && <a href={g.open()} className="text-xs font-semibold text-amber-600 hover:underline">Open in app</a>}
                        <a href={g.install} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:underline">Install</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Wallets that hold NFTs from OpenSea (MetaMask, Coinbase Wallet, Trust, Exodus, Bitget) all work here — pay in USDC from any of them. HP-Autos never has access to your keys.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
