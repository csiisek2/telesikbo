import { config } from '../config/env';

export type BetType = 'big' | 'small' | 'odd' | 'even';

export interface SicBoResult {
  dice: [number, number, number];
  sum: number;
  isOdd: boolean;
  isBig: boolean;
}

export interface GameResult {
  result: SicBoResult;
  betType: BetType;
  won: boolean;
  payout: number;
}

const PAYOUTS: Record<BetType, number> = {
  big: 2,
  small: 2,
  odd: 2,
  even: 2,
};

function rollDice(winRate: number): SicBoResult {
  const shouldWin = Math.random() < winRate;

  let dice: [number, number, number];

  if (shouldWin) {
    dice = [
      Math.floor(Math.random() * 3) + 4,
      Math.floor(Math.random() * 3) + 4,
      Math.floor(Math.random() * 3) + 4,
    ];
  } else {
    dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
  }

  const sum = dice.reduce((a, b) => a + b, 0);

  return {
    dice,
    sum,
    isOdd: sum % 2 === 1,
    isBig: sum >= 11 && sum <= 17,
  };
}

export function getWinRate(isVIP: boolean): number {
  return isVIP ? config.winRates.vip : config.winRates.normal;
}

export function playSicBo(
  betType: BetType,
  betAmount: number,
  isVIP: boolean
): GameResult {
  const winRate = getWinRate(isVIP);
  const result = rollDice(winRate);

  let won = false;
  switch (betType) {
    case 'big':
      won = result.isBig;
      break;
    case 'small':
      won = !result.isBig && result.sum >= 4;
      break;
    case 'odd':
      won = result.isOdd;
      break;
    case 'even':
      won = !result.isOdd;
      break;
  }

  const payout = won ? betAmount * PAYOUTS[betType] : 0;

  return { result, betType, won, payout };
}