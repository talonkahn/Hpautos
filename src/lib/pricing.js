// Approximate local-currency → USD rates, used ONLY when a listing has no explicit USD price.
// For escrow, admins should set `price_usd` on the listing so buyers lock an exact amount.
const USD_PER_UNIT = {
  NG: 1 / 1600, US: 1, GB: 1.27, CN: 0.14, JP: 0.0067, CA: 0.73,
  GH: 0.065, KE: 0.0077, ZA: 0.055, AE: 0.272, RW: 0.00073, CM: 0.0016, BJ: 0.0016,
};

export const carPriceUSD = (car) => {
  if (!car) return 0;
  if (car.price_usd && Number(car.price_usd) > 0) return Math.round(Number(car.price_usd) * 100) / 100;
  const rate = USD_PER_UNIT[car.country || 'NG'] ?? USD_PER_UNIT.NG;
  return Math.round(Number(car.price || 0) * rate * 100) / 100;
};

export const hasExactUSD = (car) => !!(car?.price_usd && Number(car.price_usd) > 0);
