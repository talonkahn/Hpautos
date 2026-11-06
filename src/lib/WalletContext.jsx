import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { WEB3, chain, shortAddr, switchToEscrowChain, friendlyError } from '@/lib/web3';
import { toast } from 'sonner';

const WalletContext = createContext(null);
const STORAGE_KEY = 'hp_wallet_rdns';

export function WalletProvider({ children }) {
  const [wallets, setWallets] = useState([]);       // discovered via EIP-6963 (or legacy window.ethereum)
  const [active, setActive] = useState(null);       // { info, provider }
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const triedReconnect = useRef(false);

  // ── Discover wallets ───────────────────────────────────────────────────────
  useEffect(() => {
    const onAnnounce = (e) => {
      const { info, provider } = e.detail || {};
      if (!info?.uuid) return;
      setWallets((prev) => (prev.some((w) => w.info.uuid === info.uuid) ? prev : [...prev, { info, provider }]));
    };
    window.addEventListener('eip6963:announceProvider', onAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Fallback for wallets that only inject window.ethereum
    const t = setTimeout(() => {
      const eth = window.ethereum;
      if (!eth) return;
      setWallets((prev) => {
        if (prev.length > 0) return prev;
        const name = eth.isMetaMask ? 'MetaMask' : eth.isCoinbaseWallet ? 'Coinbase Wallet' : eth.isTrust ? 'Trust Wallet' : 'Browser Wallet';
        return [{ info: { uuid: 'legacy', name, icon: '', rdns: 'legacy.injected' }, provider: eth }];
      });
    }, 600);

    return () => { window.removeEventListener('eip6963:announceProvider', onAnnounce); clearTimeout(t); };
  }, []);

  // ── Silent reconnect to the last used wallet (no popup) ────────────────────
  useEffect(() => {
    if (triedReconnect.current || wallets.length === 0) return;
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return;
    const w = wallets.find((x) => x.info.rdns === last);
    if (!w) return;
    triedReconnect.current = true;
    (async () => {
      try {
        const accounts = await w.provider.request({ method: 'eth_accounts' });
        if (accounts?.length) {
          const id = await w.provider.request({ method: 'eth_chainId' });
          setActive(w); setAddress(accounts[0]); setChainId(parseInt(id, 16));
        }
      } catch { /* stay disconnected */ }
    })();
  }, [wallets]);

  // ── Listen for account / network changes ───────────────────────────────────
  useEffect(() => {
    const provider = active?.provider;
    if (!provider?.on) return;
    const onAccounts = (accs) => {
      if (!accs?.length) { setActive(null); setAddress(null); setChainId(null); localStorage.removeItem(STORAGE_KEY); }
      else setAddress(accs[0]);
    };
    const onChain = (id) => setChainId(parseInt(id, 16));
    provider.on('accountsChanged', onAccounts);
    provider.on('chainChanged', onChain);
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts);
      provider.removeListener?.('chainChanged', onChain);
    };
  }, [active]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const connect = useCallback(async (w) => {
    setConnecting(true);
    try {
      const accounts = await w.provider.request({ method: 'eth_requestAccounts' });
      const id = await w.provider.request({ method: 'eth_chainId' });
      setActive(w); setAddress(accounts[0]); setChainId(parseInt(id, 16));
      localStorage.setItem(STORAGE_KEY, w.info.rdns);
      setModalOpen(false);
      toast.success(`${w.info.name} connected`);
      return true;
    } catch (e) {
      toast.error(friendlyError(e));
      return false;
    } finally { setConnecting(false); }
  }, []);

  const disconnect = useCallback(() => {
    setActive(null); setAddress(null); setChainId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const ensureChain = useCallback(async () => {
    if (!active) return false;
    try {
      await switchToEscrowChain(active.provider);
      const id = await active.provider.request({ method: 'eth_chainId' });
      setChainId(parseInt(id, 16));
      return true;
    } catch (e) {
      toast.error(friendlyError(e));
      return false;
    }
  }, [active]);

  const value = useMemo(() => ({
    wallets, active, address, chainId,
    shortAddress: shortAddr(address),
    isConnected: !!address,
    wrongChain: !!address && chainId !== WEB3.chainId,
    expectedChain: chain,
    connecting, modalOpen,
    openModal: () => setModalOpen(true),
    closeModal: () => setModalOpen(false),
    connect, disconnect, ensureChain,
    // context object handed to web3.js write helpers
    ctx: address && active ? { provider: active.provider, account: address } : null,
  }), [wallets, active, address, chainId, connecting, modalOpen, connect, disconnect, ensureChain]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export const useWallet = () => {
  const v = useContext(WalletContext);
  if (!v) throw new Error('useWallet must be used inside <WalletProvider>');
  return v;
};
