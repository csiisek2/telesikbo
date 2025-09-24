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

  let dice: [number, number, number];

  if (shouldWin) {
    switch (betType) {
      case 'big':
        dice = [
          Math.floor(Math.random() * 3) + 4,
          Math.floor(Math.random() * 3) + 4,
          Math.floor(Math.random() * 3) + 4,
        ];
        break;
      case 'small':
        dice = [
          Math.floor(Math.random() * 3) + 1,
          Math.floor(Math.random() * 3) + 1,
          Math.floor(Math.random() * 3) + 1,
        ];
        break;
      case 'odd':
        const oddSum = Math.floor(Math.random() * 4) * 2 + 5;
        dice = generateDiceForSum(oddSum);
        break;
      case 'even':
        const evenSum = Math.floor(Math.random() * 4) * 2 + 6;
        dice = generateDiceForSum(evenSum);
        break;
    }
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

function generateDiceForSum(targetSum: number): [number, number, number] {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * Math.min(6, targetSum - d1 - 1)) + 1;
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