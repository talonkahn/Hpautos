// ─── HP-Autos Crypto Payment Config ─────────────────────────────────────────
// Add your actual wallet addresses in your .env file

export const CRYPTO_WALLETS = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    address: import.meta.env.VITE_WALLET_BTC || '',
    color: '#F7931A',
    icon: '₿',
    network: 'Bitcoin Network',
    uriPrefix: 'bitcoin:',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: import.meta.env.VITE_WALLET_ETH || '',
    color: '#627EEA',
    icon: 'Ξ',
    network: 'ERC-20 / Ethereum Mainnet',
    uriPrefix: 'ethereum:',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether (USDT)',
    address: import.meta.env.VITE_WALLET_USDT || import.meta.env.VITE_WALLET_ETH || '',
    color: '#26A17B',
    icon: '₮',
    network: 'TRC-20 (Tron) or ERC-20',
    uriPrefix: 'ethereum:',
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    address: import.meta.env.VITE_WALLET_SOL || '',
    color: '#9945FF',
    icon: '◎',
    network: 'Solana Network',
    uriPrefix: 'solana:',
  },
};

// Supported wallets with deep link patterns
export const SUPPORTED_WALLETS = [
  { name: 'MetaMask',  icon: '🦊', deepLink: (addr, amt, sym) => `https://metamask.app.link/send/${addr}?value=${amt}&asset=${sym}`,  chains: ['ETH','USDT'] },
  { name: 'Coinbase',  icon: '🔵', deepLink: (addr, amt, sym) => `https://go.cb-w.com/pay?recipient=${addr}&amount=${amt}&asset=${sym}`, chains: ['ETH','USDT','BTC','SOL'] },
  { name: 'Exodus',    icon: '🌌', deepLink: (addr)            => `exodus://`,                                                           chains: ['BTC','ETH','USDT','SOL'] },
  { name: 'Bitget',    icon: '⚡', deepLink: (addr)            => `https://www.bitget.com/`,                                             chains: ['BTC','ETH','USDT','SOL'] },
  { name: 'Phantom',   icon: '👻', deepLink: (addr, amt)       => `https://phantom.app/ul/v1/transfer?recipient=${addr}&amount=${amt}`,  chains: ['SOL'] },
  { name: 'Trust',     icon: '🛡️', deepLink: (addr, amt, sym)  => `trust://send?address=${addr}&amount=${amt}&coin=${sym}`,              chains: ['ETH','USDT','BTC'] },
];

// Rough USD rates for display — not used for on-chain math
export const CRYPTO_RATES_USD = { BTC: 65000, ETH: 3200, USDT: 1, SOL: 150 };

export const usdToCrypto = (usdAmount, symbol) => {
  const rate = CRYPTO_RATES_USD[symbol] || 1;
  const amount = usdAmount / rate;
  // Format nicely
  if (symbol === 'BTC') return amount.toFixed(6);
  if (symbol === 'ETH') return amount.toFixed(4);
  if (symbol === 'SOL') return amount.toFixed(3);
  return amount.toFixed(2);
};

// Build a payment URI for QR code
export const buildPaymentURI = (symbol, address, amount) => {
  const wallet = CRYPTO_WALLETS[symbol];
  if (!wallet || !address) return address;
  if (symbol === 'BTC') return `bitcoin:${address}?amount=${amount}`;
  if (symbol === 'SOL') return `solana:${address}?amount=${amount}`;
  return `${address}`; // ETH/USDT — just address for QR
};
