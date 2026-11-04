import type { BranchId } from '../content/types';

export interface Theme {
  seed: number;
  leaf: [string, string, string, string, string];
  grass: [string, string, string, string];
  plateau: [string, string, string];
  sand: [string, string, string];
  cliff: [string, string, string, string];
  shallow: [string, string];
  deep: [string, string];
  trunk: [string, string];
  trees: number;
}

const HOME: Theme = {
  seed: 0,
  leaf: ['#b4d97a', '#7fae52', '#5a8a3c', '#3f6b2e', '#24401c'],
  grass: ['#5aa443', '#6dbb4f', '#4f9a3c', '#3f7d31'],
  plateau: ['#6cb84d', '#7fca5c', '#a6e07a'],
  sand: ['#ecd59a', '#d6bb7c', '#d8bd80'],
  cliff: ['#d9a46a', '#b07a4a', '#8c5c37', '#5e3d26'],
  shallow: ['#2f7fc8', '#62d3d6'],
  deep: ['#2659a8', '#2a63b8'],
  trunk: ['#efe9db', '#b5ab98'],
  trees: 12,
};

/** Each Island's landscape, so every trip looks different. Islands not listed use the home palette with their own shape. */
export const THEMES: Partial<Record<BranchId | 'home', Theme>> = {
  home: HOME,
  sentence: {
    ...HOME,
    seed: 5,
    leaf: ['#c9f08a', '#8fd05c', '#5fa83f', '#3f7d31', '#1f3f1a'],
    grass: ['#7cc95a', '#8fd66a', '#6bb84c', '#4f9a3c'],
    plateau: ['#8fd66a', '#a6e07a', '#c4f09a'],
    sand: ['#f6e7b8', '#e6d29a', '#e0c98a'],
    shallow: ['#1f9fc8', '#6fe8e0'],
    deep: ['#1f6fb8', '#2a7fc8'],
    trees: 8,
  },
  between: {
    ...HOME,
    seed: 1,
    leaf: ['#9fc46a', '#6a9a48', '#4a7a36', '#335a26', '#1a3012'],
    grass: ['#4a8f3a', '#5aa443', '#3f7d31', '#2f6b26'],
    plateau: ['#5aa443', '#6cb84d', '#8fd06a'],
    trees: 22,
  },
  convince: {
    ...HOME,
    seed: 3,
    leaf: ['#c4c48a', '#9a9a5a', '#7a7a42', '#5a5a30', '#3a3a1c'],
    grass: ['#c8783f', '#d9883f', '#b4682f', '#9a5627'],
    plateau: ['#c45a32', '#d9773f', '#e89a5a'],
    sand: ['#f0c48a', '#e0aa6a', '#dca060'],
    cliff: ['#e08a4a', '#b45a2c', '#8a3a1e', '#5a2412'],
    trees: 5,
  },
  whose: {
    ...HOME,
    seed: 2,
    leaf: ['#b8f0a0', '#7fd06a', '#4fa848', '#357a36', '#1a3a1c'],
    sand: ['#fff2cc', '#f0e0aa', '#e8d49a'],
    shallow: ['#2fb4d8', '#8ff0e8'],
    trees: 7,
  },
  pictures: {
    ...HOME,
    seed: 4,
    leaf: ['#7fb08a', '#4f8a5a', '#356a42', '#244a2e', '#10261a'],
    grass: ['#3f7d45', '#4f8f52', '#2f6b3a', '#245a2e'],
    plateau: ['#4f8f52', '#5fa060', '#7fc07a'],
    sand: ['#a89a6a', '#8a7a4a', '#7a6a3a'],
    shallow: ['#2f8f8a', '#5fc0a8'],
    trunk: ['#8a6a4f', '#5a4030'],
    trees: 18,
  },
  punctuation: {
    ...HOME,
    seed: 6,
    leaf: ['#ffffff', '#e8f3f7', '#b8d0dc', '#8aa8b8', '#4a6070'],
    grass: ['#e8f3f7', '#f4fafc', '#cfe6ef', '#b8d0dc'],
    plateau: ['#ffffff', '#f4fafc', '#ffffff'],
    sand: ['#f2e3b0', '#e0d0a0', '#d8c890'],
    cliff: ['#cfe6ef', '#9ab8c8', '#6a8898', '#4a6070'],
    trunk: ['#6a4f3a', '#4a3020'],
    trees: 9,
  },
  structure: {
    ...HOME,
    seed: 7,
    leaf: ['#7fb08a', '#4f8a5a', '#356a42', '#244a2e', '#10261a'],
    grass: ['#5f8a4a', '#6f9a58', '#4f7a3c', '#3f6a30'],
    plateau: ['#8a8d99', '#9a9daa', '#dfe8ef'],
    cliff: ['#b8bcc8', '#8a8d99', '#6d6f7a', '#4a4c56'],
    trunk: ['#6a4f3a', '#4a3020'],
    trees: 14,
  },
  editing: {
    ...HOME,
    seed: 8,
    leaf: ['#9a9a5a', '#6a6a3a', '#4a4a2a', '#33331c', '#1a1a0e'],
    grass: ['#4a4a3a', '#5e6a40', '#3d3236', '#2a2326'],
    plateau: ['#3d3236', '#4a3d40', '#ff7a3a'],
    sand: ['#5a5250', '#4a4240', '#3a3230'],
    cliff: ['#ff7a3a', '#a8442a', '#5a2a1e', '#2a1410'],
    shallow: ['#2a4a78', '#4a6a98'],
    trunk: ['#3a3230', '#2a2220'],
    trees: 6,
  },
  workshop: {
    ...HOME,
    seed: 9,
    leaf: ['#c8b0e0', '#a080c8', '#7858a8', '#503a80', '#2a1a4a'],
    shallow: ['#2a3a8a', '#4a5ac0'],
    deep: ['#1a2260', '#1f2a70'],
    trees: 10,
  },
};

export function themeFor(id: BranchId | 'home'): Theme {
  return THEMES[id] ?? { ...HOME, seed: id.length * 7 + id.charCodeAt(0) };
}
