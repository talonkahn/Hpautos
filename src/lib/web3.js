import {
  createPublicClient, createWalletClient, custom, http,
  parseUnits, formatUnits, parseEventLogs, keccak256, stringToBytes, toHex,
} from 'viem';
import { baseSepolia, base, polygonAmoy, polygon, sepolia } from 'viem/chains';
import { ESCROW_ABI, ERC20_ABI, STATUS } from './escrowAbi';

// ─── Config (all from env so the same build works on testnet and mainnet) ─────
const CHAINS = { 84532: baseSepolia, 8453: base, 80002: polygonAmoy, 137: polygon, 11155111: sepolia };

export const WEB3 = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID || 84532),
  escrow: import.meta.env.VITE_ESCROW_ADDRESS || '',
  usdc: import.meta.env.VITE_USDC_ADDRESS || '',
  usdcIsMock: import.meta.env.VITE_USDC_IS_MOCK === 'true',
  arbiter: (import.meta.env.VITE_ARBITER_ADDRESS || '').toLowerCase(),
  defaultDealer: import.meta.env.VITE_DEFAULT_DEALER_WALLET || '',
  rpc: import.meta.env.VITE_RPC_URL || '',
};

export const chain = CHAINS[WEB3.chainId] || baseSepolia;
export const isEscrowConfigured = !!(WEB3.escrow && WEB3.usdc);
export const isTestnet = !!chain.testnet;

export const publicClient = createPublicClient({
  chain,
  transport: http(WEB3.rpc || undefined),
});

// ─── Explorer links ───────────────────────────────────────────────────────────
const EXPLORER = chain.blockExplorers?.default?.url || 'https://basescan.org';
export const explorerTx = (hash) => `${EXPLORER}/tx/${hash}`;
export const explorerAddress = (addr) => `${EXPLORER}/address/${addr}`;
export const explorerNft = (tokenId) => `${EXPLORER}/nft/${WEB3.escrow}/${tokenId}`;

// ─── Formatting ───────────────────────────────────────────────────────────────
export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
export const fromUnits = (v) => Number(formatUnits(BigInt(v ?? 0), 6));
export const toUnits = (n) => parseUnits(Number(n).toFixed(2), 6);
export const sameAddr = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const isAddress = (a) => /^0x[a-fA-F0-9]{40}$/.test(a || '');
export const fmtUsd = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const friendlyError = (e) => {
  const msg = e?.shortMessage || e?.message || String(e);
  if (/user rejected|denied|rejected the request|cancel/i.test(msg)) return 'Transaction cancelled in your wallet.';
  if (/insufficient funds for gas|exceeds the balance/i.test(msg)) return 'Not enough ETH in your wallet to pay network fees.';
  if (/NotAllowed/.test(msg)) return 'This wallet is not allowed to perform that action on this order.';
  if (/BadStatus/.test(msg)) return 'This order is not in the right state for that action.';
  if (/BadParam/.test(msg)) return 'The contract rejected one of the parameters (or a deadline has not passed yet).';
  return msg.length > 220 ? `${msg.slice(0, 220)}…` : msg;
};

// ─── Network switching ────────────────────────────────────────────────────────
export async function switchToEscrowChain(provider) {
  const hexId = `0x${chain.id.toString(16)}`;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
  } catch (err) {
    if (err?.code === 4902 || /unrecognized chain|not been added/i.test(err?.message || '')) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: hexId,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [WEB3.rpc || chain.rpcUrls.default.http[0]],
          blockExplorerUrls: [EXPLORER],
        }],
      });
    } else throw err;
  }
}

// ─── Internals ────────────────────────────────────────────────────────────────
const walletFor = ({ provider, account }) =>
  createWalletClient({ account, chain, transport: custom(provider) });

async function send(ctx, params) {
  const wallet = walletFor(ctx);
  const hash = await wallet.writeContract({ chain, account: ctx.account, ...params });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error('Transaction reverted on-chain.');
  return { hash, receipt };
}

const escrowCall = (ctx, functionName, args) =>
  send(ctx, { address: WEB3.escrow, abi: ESCROW_ABI, functionName, args });

// ─── Reads ────────────────────────────────────────────────────────────────────
export async function readOrder(chainOrderId) {
  const o = await publicClient.readContract({
    address: WEB3.escrow, abi: ESCROW_ABI, functionName: 'getOrder', args: [BigInt(chainOrderId)],
  });
  const status = Number(o.status);
  return {
    buyer: o.buyer,
    dealer: o.dealer,
    amount: fromUnits(o.amount),
    paidOut: fromUnits(o.paidOut),
    remaining: fromUnits(o.amount - o.paidOut),
    shipBps: Number(o.shipBps),
    autoReleaseWindow: Number(o.autoReleaseWindow),
    shipDeadline: Number(o.shipDeadline),
    deliveredAt: Number(o.deliveredAt),
    status,
    statusLabel: STATUS[status] || 'Unknown',
  };
}

export const readUsdcBalance = async (address) =>
  fromUnits(await publicClient.readContract({
    address: WEB3.usdc, abi: ERC20_ABI, functionName: 'balanceOf', args: [address],
  }));

// ─── Passport NFT metadata (stored fully on-chain as a data URI) ──────────────
export function buildPassportURI({ car, priceUSD, buyer }) {
  const meta = {
    name: `HP-Autos Vehicle Passport — ${car.title}`,
    description: 'Verifiable on-chain record of an escrowed vehicle purchase on HP-Autos. Not legal title.',
    image: car.images?.[0] || undefined,
    external_url: `${window.location.origin}/CarDetails?id=${car.id}`,
    attributes: [
      { trait_type: 'Make', value: car.make || 'N/A' },
      { trait_type: 'Model', value: car.model || 'N/A' },
      { trait_type: 'Year', value: car.year || 'N/A' },
      { trait_type: 'Country', value: car.country || 'NG' },
      { trait_type: 'Condition', value: car.condition || 'N/A' },
      { trait_type: 'Price (USD)', value: priceUSD },
      { trait_type: 'Listing ID', value: car.id },
      { trait_type: 'Listing Hash', value: keccak256(stringToBytes(`${car.id}|${car.title}|${car.price}`)) },
      { trait_type: 'Buyer', value: buyer },
    ],
  };
  const json = JSON.stringify(meta);
  return `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
}

// ─── Writes ───────────────────────────────────────────────────────────────────
/** Mint test USDC from the faucet (mock token on testnet only). */
export const faucetUsdc = (ctx, amountUsd = 10_000) =>
  send(ctx, { address: WEB3.usdc, abi: ERC20_ABI, functionName: 'faucet', args: [toUnits(amountUsd)] });

/**
 * Approve exactly the order amount (never unlimited) and lock it in escrow.
 * Reports progress through `onStep('approve' | 'lock')`.
 */
export async function createEscrowOrder(ctx, { dealer, amountUsd, carRef, passportURI, shipBps = 2000, shipDays = 14, autoDays = 7 }, onStep) {
  const amount = toUnits(amountUsd);

  const balance = await publicClient.readContract({
    address: WEB3.usdc, abi: ERC20_ABI, functionName: 'balanceOf', args: [ctx.account],
  });
  if (balance < amount) throw new Error(`Insufficient USDC. You need ${fmtUsd(amountUsd)} but have ${fmtUsd(fromUnits(balance))}.`);

  const allowance = await publicClient.readContract({
    address: WEB3.usdc, abi: ERC20_ABI, functionName: 'allowance', args: [ctx.account, WEB3.escrow],
  });
  let approveHash = null;
  if (allowance < amount) {
    onStep?.('approve');
    ({ hash: approveHash } = await send(ctx, {
      address: WEB3.usdc, abi: ERC20_ABI, functionName: 'approve', args: [WEB3.escrow, amount],
    }));
  }

  onStep?.('lock');
  const { hash, receipt } = await escrowCall(ctx, 'createOrder', [{
    dealer,
    amount,
    shipBps,
    shipWindow: shipDays * 86400,
    autoReleaseWindow: autoDays * 86400,
    carRef,
    passportURI,
  }]);

  const [created] = parseEventLogs({ abi: ESCROW_ABI, logs: receipt.logs, eventName: 'OrderCreated' });
  if (!created) throw new Error('Order created but the event could not be read. Check the transaction on the explorer.');

  return {
    chainOrderId: Number(created.args.id),
    hash,
    approveHash,
    blockNumber: Number(receipt.blockNumber),
  };
}

export const markShipped = (ctx, id, trackingRef) => escrowCall(ctx, 'markShipped', [BigInt(id), trackingRef]);
export const markDelivered = (ctx, id) => escrowCall(ctx, 'markDelivered', [BigInt(id)]);
export const confirmDelivery = (ctx, id) => escrowCall(ctx, 'confirmDelivery', [BigInt(id)]);
export const autoRelease = (ctx, id) => escrowCall(ctx, 'autoRelease', [BigInt(id)]);
export const refundIfNotShipped = (ctx, id) => escrowCall(ctx, 'refundIfNotShipped', [BigInt(id)]);
export const raiseDispute = (ctx, id, reason) => escrowCall(ctx, 'raiseDispute', [BigInt(id), reason]);
export const postMilestone = (ctx, id, label, note = '') =>
  escrowCall(ctx, 'postMilestone', [BigInt(id), label, keccak256(toHex(stringToBytes(`${label}|${note}`)))]);
export const resolveDispute = (ctx, id, toDealerUsd, sold) =>
  escrowCall(ctx, 'resolveDispute', [BigInt(id), toUnits(toDealerUsd), !!sold]);
