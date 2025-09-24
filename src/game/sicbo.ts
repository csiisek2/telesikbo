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

function rollDice(winRate: number, betType: BetType): SicBoResult {
  const shouldWin = Math.random() < winRate;

  let targetSum: number;

  if (shouldWin) {
    switch (betType) {
      case 'big':
        targetSum = Math.floor(Math.random() * 7) + 11;
        break;
      case 'small':
        targetSum = Math.floor(Math.random() * 7) + 4;
        break;
      case 'odd':
        targetSum = [5, 7, 9, 11, 13, 15][Math.floor(Math.random() * 6)];
        break;
      case 'even':
        targetSum = [6, 8, 10, 12, 14, 16][Math.floor(Math.random() * 6)];
        break;
    }
  } else {
    targetSum = Math.floor(Math.random() * 15) + 3;
  }

  const dice = generateDiceForSum(targetSum);
  const sum = dice.reduce((a, b) => a + b, 0);

  return {
    dice,
    sum,
    isOdd: sum % 2 === 1,
    isBig: sum >= 11 && sum <= 17,
  };
}

function generateDiceForSum(targetSum: number): [number, number, number] {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const remaining = targetSum - d1;

  const minD2 = Math.max(1, remaining - 6);
  const maxD2 = Math.min(6, remaining - 1);

  if (minD2 > maxD2) {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
  }

  const d2 = Math.floor(Math.random() * (maxD2 - minD2 + 1)) + minD2;
  const d3 = targetSum - d1 - d2;

  if (d3 < 1 || d3 > 6) {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
  }

  return [d1, d2, d3];
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
  const result = rollDice(winRate, betType);

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