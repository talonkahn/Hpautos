# HP-Autos Escrow — Web3 setup & demo guide

**The problem:** cross-border car buyers can't trust sellers they've never met, and dealers can't trust that buyers will pay.
**The fix:** the buyer locks USDC in a non-custodial smart contract. The dealer gets a freight slice when they post shipping proof, and the rest when the car arrives. If the dealer never ships, the buyer gets a full on-chain refund.

## What's in the box
| Piece | Where |
|---|---|
| Escrow + Vehicle Passport NFT contract | `contracts/contracts/HPAutosEscrow.sol` |
| Testnet USDC with a public faucet | `contracts/contracts/MockUSDC.sol` |
| Contract tests (6 passing) | `contracts/test/` |
| Wallet connect (MetaMask, Coinbase, Exodus, Bitget, Trust… via EIP-6963) | `src/lib/WalletContext.jsx`, `src/components/WalletModal.jsx` |
| Buyer checkout ("Buy with Escrow") | `src/components/escrow/EscrowCheckoutModal.jsx` |
| Buyer orders + tracking timeline | `/MyOrders` |
| Dealer dashboard (locked / released, post proof, milestones) | `/DealerEscrow` |
| Admin escrow tab (dispute resolution) | Admin Dashboard → 🛡️ Escrow |

## 1. Run the tests
```bash
cd contracts
npm install
npx hardhat test          # 6 passing
```

## 2. Deploy to Base Sepolia (testnet)
1. Make a **throwaway** wallet, get free test ETH from a Base Sepolia faucet.
2. `cd contracts && cp .env.example .env` and set `DEPLOYER_PRIVATE_KEY` (testnet key only!).
3. `npx hardhat run scripts/deploy.cjs --network baseSepolia`
4. Copy the printed `VITE_…` lines into the web app's `.env` **and** Vercel env vars, then redeploy.

Set `ARBITER_ADDRESS` before deploying if the arbiter should be a different wallet than the deployer (recommended: a multisig for production).

## 3. Database
Run the **WEB3 ESCROW** block at the bottom of `MIGRATION_RUN_NOW.sql` in the Supabase SQL editor.

## 4. List cars so they can be escrowed
In Admin → List Car, fill **Exact price in USD** and **Dealer payout wallet**. If left blank, the wallet falls back to `VITE_DEFAULT_DEALER_WALLET` and the USD price is estimated from local currency at approximate rates.

## 5. Demo script (≈3 minutes)
1. Open a car → **Buy with Escrow** → enter delivery details → connect wallet → **Get free test USDC** → **Lock funds** (2 wallet prompts).
2. Switch to the dealer wallet → `/DealerEscrow` → **Post shipping proof** → 20% releases instantly → add a milestone.
3. Back as buyer → `/MyOrders` → timeline updates live, each step links to the block explorer.
4. **Confirm delivery** → remaining funds release, Vehicle Passport NFT lands in the buyer's wallet.
5. (Optional) Show a dispute: raise it, then resolve as the arbiter in the Admin → Escrow tab.

## Honest limits (say these in the pitch — judges respect it)
- **Delivery proof is attested, not oracle-verified.** The dealer declares milestones; the buyer confirms receipt; silence auto-releases after a window. Roadmap: carrier/AIS API attestations.
- **The Vehicle Passport NFT is a verifiable record, not legal title.**
- **Escrow is stablecoin only (USDC).** BTC/ETH/SOL direct-pay stays as the manual proof-of-payment flow; card/Flutterwave payments can't sit in on-chain escrow (fiat on-ramp is roadmap).
- **The Supabase mirror is a convenience index.** The UI re-reads status from the chain, and funds can only move through the contract. For production, move mirror writes to an indexer/edge function that verifies transaction logs.
- **Delivery address and phone** go to admin via WhatsApp only — never on-chain or in the public orders table.
- Testnet only until the contract is audited.
