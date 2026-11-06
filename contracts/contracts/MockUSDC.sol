// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice TESTNET ONLY. A 6-decimal stablecoin with a public faucet so judges
/// and testers can try the full escrow flow without hunting for test USDC.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) { return 6; }

    /// @dev Anyone can mint, capped at 50,000 USDC per call.
    function faucet(uint256 amount) external {
        require(amount <= 50_000 * 1e6, "max 50k per call");
        _mint(msg.sender, amount);
    }
}
