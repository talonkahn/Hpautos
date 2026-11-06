const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-toolbox/network-helpers');

const USDC = (n) => ethers.parseUnits(String(n), 6);
const DAY = 24 * 3600;

describe('HPAutosEscrow', () => {
  let usdc, escrow, arbiter, buyer, dealer, feeWallet, stranger;
  const PRICE = USDC(10_000);

  const params = (over = {}) => ({
    dealer: dealer.address,
    amount: PRICE,
    shipBps: 2000,
    shipWindow: 14 * DAY,
    autoReleaseWindow: 7 * DAY,
    carRef: 'car-123',
    passportURI: 'data:application/json;base64,e30=',
    ...over,
  });

  async function fundOrder(over) {
    await escrow.connect(buyer).createOrder(params(over));
    return await escrow.nextOrderId();
  }

  beforeEach(async () => {
    [arbiter, buyer, dealer, feeWallet, stranger] = await ethers.getSigners();
    usdc = await (await ethers.getContractFactory('MockUSDC')).deploy();
    escrow = await (await ethers.getContractFactory('HPAutosEscrow')).deploy(
      await usdc.getAddress(), arbiter.address, feeWallet.address, 100 // 1% fee
    );
    await usdc.connect(buyer).faucet(USDC(50_000));
    await usdc.connect(buyer).approve(await escrow.getAddress(), ethers.MaxUint256);
  });

  it('locks funds, releases the shipping slice, then the rest on confirmation (happy path)', async () => {
    const id = await fundOrder();
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(PRICE);
    expect(await escrow.ownerOf(id)).to.equal(await escrow.getAddress()); // passport held by escrow

    await escrow.connect(dealer).markShipped(id, 'BL-998877');
    // 20% of 10,000 = 2,000 gross; 1% fee = 20 -> dealer 1,980
    expect(await usdc.balanceOf(dealer.address)).to.equal(USDC(1_980));
    expect(await usdc.balanceOf(feeWallet.address)).to.equal(USDC(20));

    await escrow.connect(dealer).postMilestone(id, 'Departed port', ethers.ZeroHash);
    await escrow.connect(dealer).markDelivered(id);
    await escrow.connect(buyer).confirmDelivery(id);

    // remaining 8,000 gross; fee 80 -> dealer +7,920
    expect(await usdc.balanceOf(dealer.address)).to.equal(USDC(9_900));
    expect(await usdc.balanceOf(feeWallet.address)).to.equal(USDC(100));
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0);
    expect(await escrow.ownerOf(id)).to.equal(buyer.address); // passport now with buyer
    expect((await escrow.getOrder(id)).status).to.equal(4); // Released
  });

  it('refunds the buyer in full if the dealer never ships', async () => {
    const id = await fundOrder();
    await expect(escrow.refundIfNotShipped(id)).to.be.revertedWithCustomError(escrow, 'BadParam');
    await time.increase(15 * DAY);
    const before = await usdc.balanceOf(buyer.address);
    await escrow.connect(stranger).refundIfNotShipped(id); // anyone can trigger
    expect(await usdc.balanceOf(buyer.address)).to.equal(before + PRICE);
    await expect(escrow.ownerOf(id)).to.be.reverted; // passport burned
  });

  it('auto-releases to the dealer if the buyer stays silent after delivery', async () => {
    const id = await fundOrder();
    await escrow.connect(dealer).markShipped(id, 'BL-1');
    await escrow.connect(dealer).markDelivered(id);
    await expect(escrow.autoRelease(id)).to.be.revertedWithCustomError(escrow, 'BadParam');
    await time.increase(8 * DAY);
    await escrow.connect(stranger).autoRelease(id);
    expect(await usdc.balanceOf(dealer.address)).to.equal(USDC(9_900));
    expect(await escrow.ownerOf(id)).to.equal(buyer.address);
  });

  it('freezes funds on dispute and lets only the arbiter split them', async () => {
    const id = await fundOrder();
    await escrow.connect(dealer).markShipped(id, 'BL-2'); // dealer already got 2,000 gross
    await escrow.connect(buyer).raiseDispute(id, 'Car not as described');

    await expect(escrow.connect(buyer).confirmDelivery(id)).to.be.revertedWithCustomError(escrow, 'BadStatus');
    await expect(escrow.connect(buyer).resolveDispute(id, 0, false)).to.be.reverted; // not arbiter
    await expect(escrow.connect(arbiter).resolveDispute(id, USDC(8_001), true))
      .to.be.revertedWithCustomError(escrow, 'BadParam'); // more than remaining

    const buyerBefore = await usdc.balanceOf(buyer.address);
    await escrow.connect(arbiter).resolveDispute(id, USDC(3_000), false); // 3k dealer, 5k buyer, sale failed
    expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBefore + USDC(5_000));
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0);
    await expect(escrow.ownerOf(id)).to.be.reverted; // burned: sale failed
  });

  it('enforces roles and valid states', async () => {
    const id = await fundOrder();
    await expect(escrow.connect(stranger).markShipped(id, 'x')).to.be.revertedWithCustomError(escrow, 'NotAllowed');
    await expect(escrow.connect(buyer).markShipped(id, 'x')).to.be.revertedWithCustomError(escrow, 'NotAllowed');
    await expect(escrow.connect(dealer).markDelivered(id)).to.be.revertedWithCustomError(escrow, 'BadStatus');
    await expect(escrow.connect(stranger).raiseDispute(id, 'x')).to.be.revertedWithCustomError(escrow, 'NotAllowed');
    await escrow.connect(dealer).markShipped(id, 'BL-3');
    await expect(escrow.connect(dealer).markShipped(id, 'BL-3')).to.be.revertedWithCustomError(escrow, 'BadStatus');
  });

  it('rejects bad parameters', async () => {
    await expect(escrow.connect(buyer).createOrder(params({ amount: 0 }))).to.be.revertedWithCustomError(escrow, 'BadParam');
    await expect(escrow.connect(buyer).createOrder(params({ shipBps: 6000 }))).to.be.revertedWithCustomError(escrow, 'BadParam');
    await expect(escrow.connect(buyer).createOrder(params({ dealer: buyer.address }))).to.be.revertedWithCustomError(escrow, 'BadParam');
    await expect(escrow.connect(buyer).createOrder(params({ shipWindow: 60 }))).to.be.revertedWithCustomError(escrow, 'BadParam');
  });
});
