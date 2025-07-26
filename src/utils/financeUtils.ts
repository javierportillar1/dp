export const roundToNearest500Or1000 = (amount: number): number => {
  const remainder = amount % 1000;
  if (remainder <= 500) {
    return Math.floor(amount / 1000) * 1000 + (remainder > 0 ? 500 : 0);
  } else {
    return Math.ceil(amount / 1000) * 1000;
  }
};
