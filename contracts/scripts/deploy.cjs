// Usage: npx hardhat run scripts/deploy.cjs --network baseSepolia
// Needs DEPLOYER_PRIVATE_KEY in contracts/.env (a throwaway TESTNET key with a little test ETH).
const hre = require('hardhat');

async function main() {
  const signers = await hre.ethers.getSigners();
  if (!signers.length) {
    console.error('\n❌ No valid DEPLOYER_PRIVATE_KEY found in contracts/.env');
    console.error('   It must be a 64-character hex key (optionally starting with 0x) from a THROWAWAY testnet wallet.');
    console.error('   Right now it is empty or still the placeholder text from .env.example.\n');
    process.exit(1);
  }
  const [deployer] = signers;
  console.log('Deploying with', deployer.address);

  // Use real USDC by exporting USDC_ADDRESS; otherwise deploy the faucet mock for the demo.
  let usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    const mock = await (await hre.ethers.getContractFactory('MockUSDC')).deploy();
    await mock.waitForDeployment();
    usdcAddress = await mock.getAddress();
    console.log('MockUSDC deployed:', usdcAddress);
  }

  const arbiter = process.env.ARBITER_ADDRESS || deployer.address;      // use a multisig in production
  const feeWallet = process.env.FEE_RECIPIENT || deployer.address;
  const feeBps = Number(process.env.FEE_BPS || 100);                      // 1%

  const escrow = await (await hre.ethers.getContractFactory('HPAutosEscrow'))
    .deploy(usdcAddress, arbiter, feeWallet, feeBps);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log('\n✅ HPAutosEscrow deployed:', escrowAddress);
  console.log('\nAdd these to your web app .env (and Vercel):');
  console.log(`VITE_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);
  console.log(`VITE_USDC_IS_MOCK=${process.env.USDC_ADDRESS ? 'false' : 'true'}`);
  console.log(`VITE_ARBITER_ADDRESS=${arbiter}`);
  const net = await hre.ethers.provider.getNetwork();
  console.log(`VITE_CHAIN_ID=${net.chainId}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
