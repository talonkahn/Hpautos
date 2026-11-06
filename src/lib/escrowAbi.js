import { parseAbi } from 'viem';

export const ESCROW_ABI = parseAbi([
  'struct Order { address buyer; address dealer; uint256 amount; uint256 paidOut; uint16 shipBps; uint32 autoReleaseWindow; uint40 shipDeadline; uint40 deliveredAt; uint8 status; uint8 statusBeforeDispute; }',
  'struct CreateParams { address dealer; uint256 amount; uint16 shipBps; uint32 shipWindow; uint32 autoReleaseWindow; string carRef; string passportURI; }',

  'function createOrder(CreateParams p) returns (uint256 id)',
  'function markShipped(uint256 id, string trackingRef)',
  'function postMilestone(uint256 id, string label, bytes32 proofHash)',
  'function markDelivered(uint256 id)',
  'function confirmDelivery(uint256 id)',
  'function autoRelease(uint256 id)',
  'function refundIfNotShipped(uint256 id)',
  'function raiseDispute(uint256 id, string reason)',
  'function resolveDispute(uint256 id, uint256 toDealerGross, bool sold)',
  'function getOrder(uint256 id) view returns (Order)',
  'function remaining(uint256 id) view returns (uint256)',
  'function owner() view returns (address)',
  'function feeBps() view returns (uint16)',
  'function nextOrderId() view returns (uint256)',

  'event OrderCreated(uint256 indexed id, address indexed buyer, address indexed dealer, uint256 amount, string carRef)',
  'event OrderShipped(uint256 indexed id, string trackingRef, uint256 netReleased, uint256 fee)',
  'event MilestonePosted(uint256 indexed id, address indexed by, string label, bytes32 proofHash)',
  'event OrderDelivered(uint256 indexed id, address indexed by)',
  'event OrderReleased(uint256 indexed id, uint256 netToDealer, uint256 fee)',
  'event OrderRefunded(uint256 indexed id, uint256 amount)',
  'event DisputeRaised(uint256 indexed id, address indexed by, string reason)',
  'event DisputeResolved(uint256 indexed id, uint256 toDealerGross, uint256 toBuyer, bool sold)',

  'error BadStatus(uint8 current)',
  'error NotAllowed()',
  'error BadParam(string what)',
]);

export const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function faucet(uint256 amount)',
]);

export const STATUS = ['None', 'Funded', 'Shipped', 'Delivered', 'Released', 'Refunded', 'Disputed', 'Resolved'];
export const S = { NONE: 0, FUNDED: 1, SHIPPED: 2, DELIVERED: 3, RELEASED: 4, REFUNDED: 5, DISPUTED: 6, RESOLVED: 7 };
