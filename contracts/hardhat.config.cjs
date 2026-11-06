require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();
const { subtask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require('hardhat/builtin-tasks/task-names');

// Opt-in: compile with the bundled `solc` npm package instead of downloading the
// compiler binary (useful in locked-down CI/sandboxes). Run with USE_SOLCJS=1.
if (process.env.USE_SOLCJS === '1') {
  subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, runSuper) => {
    if (args.solcVersion === '0.8.24') {
      return {
        compilerPath: require.resolve('solc/soljson.js'),
        isSolcJs: true,
        version: '0.8.24',
        longVersion: '0.8.24+commit.e11b9ed9',
      };
    }
    return runSuper();
  });
}

// Only use the key if it is a real 32-byte hex key. A placeholder (or empty value) must not
// break `hardhat test` / `compile`; deploying without a valid key fails with a clear message instead.
const PK = (process.env.DEPLOYER_PRIVATE_KEY || '').trim();
const VALID_PK = /^(0x)?[0-9a-fA-F]{64}$/.test(PK);
const accounts = VALID_PK ? [PK.startsWith('0x') ? PK : `0x${PK}`] : [];

module.exports = {
  solidity: { version: '0.8.24', settings: { evmVersion: 'cancun', optimizer: { enabled: true, runs: 200 } } },
  networks: {
    baseSepolia: { url: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org', chainId: 84532, accounts },
    polygonAmoy: { url: process.env.AMOY_RPC || 'https://rpc-amoy.polygon.technology', chainId: 80002, accounts },
  },
};
