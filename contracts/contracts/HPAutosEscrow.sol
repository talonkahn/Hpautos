// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HP-Autos Escrow
 * @notice Non-custodial escrow for cross-border vehicle purchases.
 *
 *  - The buyer locks stablecoin (USDC) in this contract.
 *  - The dealer gets a configurable first slice when they post shipping proof,
 *    so they can cover freight costs. The rest is released on delivery.
 *  - Timeouts protect both sides: refund if the dealer never ships, auto-release
 *    if the buyer goes silent after delivery is declared.
 *  - A dispute freezes the remaining funds. The arbiter (contract owner, ideally
 *    a multisig) splits them. The arbiter can NEVER move funds anywhere except
 *    to the order's buyer, the order's dealer and the fee recipient.
 *  - Every order mints a "Vehicle Passport" NFT. The contract holds it during the
 *    order, then transfers it to the buyer on a completed sale or burns it if
 *    the sale fails.
 *
 * NOTE: the NFT is a verifiable on-chain record of the order and inspection
 * data. It is NOT legal title to the vehicle.
 */
contract HPAutosEscrow is ERC721URIStorage, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status { None, Funded, Shipped, Delivered, Released, Refunded, Disputed, Resolved }

    struct Order {
        address buyer;
        address dealer;
        uint256 amount;          // total locked, in token units
        uint256 paidOut;         // gross amount already sent down the dealer path
        uint16 shipBps;          // share released when shipping proof is posted
        uint32 autoReleaseWindow;
        uint40 shipDeadline;
        uint40 deliveredAt;
        Status status;
        Status statusBeforeDispute;
    }

    struct CreateParams {
        address dealer;
        uint256 amount;
        uint16 shipBps;
        uint32 shipWindow;        // seconds the dealer has to ship
        uint32 autoReleaseWindow; // seconds the buyer has to react after delivery is declared
        string carRef;            // listing id / VIN reference
        string passportURI;       // metadata URI for the Vehicle Passport NFT
    }

    uint16 public constant MAX_SHIP_BPS = 5000;   // dealer slice capped at 50%
    uint16 public constant MAX_FEE_BPS = 500;     // platform fee capped at 5%
    uint32 public constant MIN_WINDOW = 1 hours;
    uint32 public constant MAX_SHIP_WINDOW = 120 days;
    uint32 public constant MAX_AUTO_WINDOW = 60 days;

    IERC20 public immutable token;
    address public feeRecipient;
    uint16 public feeBps;
    uint256 public nextOrderId;

    mapping(uint256 => Order) private _orders;

    event OrderCreated(uint256 indexed id, address indexed buyer, address indexed dealer, uint256 amount, string carRef);
    event OrderShipped(uint256 indexed id, string trackingRef, uint256 netReleased, uint256 fee);
    event MilestonePosted(uint256 indexed id, address indexed by, string label, bytes32 proofHash);
    event OrderDelivered(uint256 indexed id, address indexed by);
    event OrderReleased(uint256 indexed id, uint256 netToDealer, uint256 fee);
    event OrderRefunded(uint256 indexed id, uint256 amount);
    event DisputeRaised(uint256 indexed id, address indexed by, string reason);
    event DisputeResolved(uint256 indexed id, uint256 toDealerGross, uint256 toBuyer, bool sold);

    error BadStatus(Status current);
    error NotAllowed();
    error BadParam(string what);

    constructor(IERC20 token_, address arbiter, address feeRecipient_, uint16 feeBps_)
        ERC721("HP-Autos Vehicle Passport", "HPVP")
        Ownable(arbiter)
    {
        if (feeBps_ > MAX_FEE_BPS) revert BadParam("fee");
        token = token_;
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
    }

    // ───────────────────────────── Buyer: create ─────────────────────────────

    function createOrder(CreateParams calldata p) external nonReentrant returns (uint256 id) {
        if (p.dealer == address(0) || p.dealer == msg.sender) revert BadParam("dealer");
        if (p.amount == 0) revert BadParam("amount");
        if (p.shipBps > MAX_SHIP_BPS) revert BadParam("shipBps");
        if (p.shipWindow < MIN_WINDOW || p.shipWindow > MAX_SHIP_WINDOW) revert BadParam("shipWindow");
        if (p.autoReleaseWindow < MIN_WINDOW || p.autoReleaseWindow > MAX_AUTO_WINDOW) revert BadParam("autoWindow");

        id = ++nextOrderId;
        _orders[id] = Order({
            buyer: msg.sender,
            dealer: p.dealer,
            amount: p.amount,
            paidOut: 0,
            shipBps: p.shipBps,
            autoReleaseWindow: p.autoReleaseWindow,
            shipDeadline: uint40(block.timestamp + p.shipWindow),
            deliveredAt: 0,
            status: Status.Funded,
            statusBeforeDispute: Status.None
        });

        token.safeTransferFrom(msg.sender, address(this), p.amount);

        _mint(address(this), id);
        _setTokenURI(id, p.passportURI);

        emit OrderCreated(id, msg.sender, p.dealer, p.amount, p.carRef);
    }

    // ───────────────────────────── Dealer actions ────────────────────────────

    /// @notice Dealer posts shipping proof. Releases the first slice for freight costs.
    function markShipped(uint256 id, string calldata trackingRef) external nonReentrant {
        Order storage o = _orders[id];
        if (msg.sender != o.dealer) revert NotAllowed();
        if (o.status != Status.Funded) revert BadStatus(o.status);
        if (bytes(trackingRef).length == 0) revert BadParam("trackingRef");

        o.status = Status.Shipped;

        uint256 gross = (o.amount * o.shipBps) / 10_000;
        uint256 net;
        uint256 fee;
        if (gross > 0) (net, fee) = _payDealer(o, gross);

        emit OrderShipped(id, trackingRef, net, fee);
    }

    /// @notice Post a transit milestone (port departure, customs cleared, ...). Dealer or arbiter.
    function postMilestone(uint256 id, string calldata label, bytes32 proofHash) external {
        Order storage o = _orders[id];
        if (msg.sender != o.dealer && msg.sender != owner()) revert NotAllowed();
        if (o.status != Status.Shipped) revert BadStatus(o.status);
        emit MilestonePosted(id, msg.sender, label, proofHash);
    }

    /// @notice Declare the vehicle delivered. Starts the buyer's confirmation window.
    function markDelivered(uint256 id) external {
        Order storage o = _orders[id];
        if (msg.sender != o.dealer && msg.sender != owner()) revert NotAllowed();
        if (o.status != Status.Shipped) revert BadStatus(o.status);
        o.status = Status.Delivered;
        o.deliveredAt = uint40(block.timestamp);
        emit OrderDelivered(id, msg.sender);
    }

    // ───────────────────────────── Buyer actions ─────────────────────────────

    /// @notice Buyer confirms the car arrived. Releases everything still held to the dealer.
    function confirmDelivery(uint256 id) external nonReentrant {
        Order storage o = _orders[id];
        if (msg.sender != o.buyer) revert NotAllowed();
        if (o.status != Status.Shipped && o.status != Status.Delivered) revert BadStatus(o.status);
        _finalizeSale(id, o);
    }

    /// @notice Anyone can trigger the release once the buyer's window has passed in silence.
    function autoRelease(uint256 id) external nonReentrant {
        Order storage o = _orders[id];
        if (o.status != Status.Delivered) revert BadStatus(o.status);
        if (block.timestamp < uint256(o.deliveredAt) + o.autoReleaseWindow) revert BadParam("window open");
        _finalizeSale(id, o);
    }

    /// @notice Anyone can trigger a full refund if the dealer missed the shipping deadline.
    function refundIfNotShipped(uint256 id) external nonReentrant {
        Order storage o = _orders[id];
        if (o.status != Status.Funded) revert BadStatus(o.status);
        if (block.timestamp <= o.shipDeadline) revert BadParam("deadline not passed");

        uint256 amt = o.amount - o.paidOut;
        o.status = Status.Refunded;
        token.safeTransfer(o.buyer, amt);
        _burn(id);
        emit OrderRefunded(id, amt);
    }

    // ───────────────────────────── Disputes ──────────────────────────────────

    function raiseDispute(uint256 id, string calldata reason) external {
        Order storage o = _orders[id];
        if (msg.sender != o.buyer && msg.sender != o.dealer) revert NotAllowed();
        if (o.status != Status.Funded && o.status != Status.Shipped && o.status != Status.Delivered) {
            revert BadStatus(o.status);
        }
        o.statusBeforeDispute = o.status;
        o.status = Status.Disputed;
        emit DisputeRaised(id, msg.sender, reason);
    }

    /// @notice Arbiter splits the funds still held. `sold` decides what happens to the passport NFT.
    function resolveDispute(uint256 id, uint256 toDealerGross, bool sold) external onlyOwner nonReentrant {
        Order storage o = _orders[id];
        if (o.status != Status.Disputed) revert BadStatus(o.status);

        uint256 held = o.amount - o.paidOut;
        if (toDealerGross > held) revert BadParam("split");
        uint256 toBuyer = held - toDealerGross;

        o.status = Status.Resolved;
        if (toDealerGross > 0) _payDealer(o, toDealerGross);
        if (toBuyer > 0) token.safeTransfer(o.buyer, toBuyer);

        if (sold) _transfer(address(this), o.buyer, id);
        else _burn(id);

        emit DisputeResolved(id, toDealerGross, toBuyer, sold);
    }

    // ───────────────────────────── Admin ─────────────────────────────────────

    function setFee(uint16 bps) external onlyOwner {
        if (bps > MAX_FEE_BPS) revert BadParam("fee");
        feeBps = bps;
    }

    function setFeeRecipient(address to) external onlyOwner {
        if (to == address(0)) revert BadParam("recipient");
        feeRecipient = to;
    }

    // ───────────────────────────── Views ─────────────────────────────────────

    function getOrder(uint256 id) external view returns (Order memory) {
        return _orders[id];
    }

    function remaining(uint256 id) external view returns (uint256) {
        Order storage o = _orders[id];
        return o.amount - o.paidOut;
    }

    // ───────────────────────────── Internals ─────────────────────────────────

    function _finalizeSale(uint256 id, Order storage o) internal {
        uint256 left = o.amount - o.paidOut;
        o.status = Status.Released;
        uint256 net;
        uint256 fee;
        if (left > 0) (net, fee) = _payDealer(o, left);
        _transfer(address(this), o.buyer, id);
        emit OrderReleased(id, net, fee);
    }

    function _payDealer(Order storage o, uint256 gross) internal returns (uint256 net, uint256 fee) {
        o.paidOut += gross;
        fee = (gross * feeBps) / 10_000;
        net = gross - fee;
        if (fee > 0) token.safeTransfer(feeRecipient, fee);
        token.safeTransfer(o.dealer, net);
    }
}
