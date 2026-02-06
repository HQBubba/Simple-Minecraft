
import { BlockType } from './types';

export const BLOCKS: Record<BlockType, { color: string; altColor: string; label: string; icon: string; transparent?: boolean; nonPlaceable?: boolean; emissive?: string }> = {
  grass: { color: '#5d9948', altColor: '#4d7c0f', label: 'Grass', icon: '🌱' },
  dirt: { color: '#866043', altColor: '#78350f', label: 'Dirt', icon: '🟫' },
  stone: { color: '#888888', altColor: '#777777', label: 'Stone', icon: '🪨' },
  cobblestone: { color: '#777777', altColor: '#555555', label: 'Cobblestone', icon: '🧱' },
  log: { color: '#664d33', altColor: '#451a03', label: 'Log', icon: '🪵' },
  wood: { color: '#a07e4d', altColor: '#92400e', label: 'Wood Planks', icon: '📁' },
  leaves: { color: '#3d6e1f', altColor: '#2d4d12', label: 'Leaves', icon: '🍃', transparent: true },
  glass: { color: '#e0f2fe', altColor: '#bae6fd', label: 'Glass', icon: '💎', transparent: true },
  sand: { color: '#e3d081', altColor: '#d1b464', label: 'Sand', icon: '🏖️' },
  bedrock: { color: '#222222', altColor: '#111111', label: 'Bedrock', icon: '⬛' },
  coal_ore: { color: '#333333', altColor: '#888888', label: 'Coal Ore', icon: '🌑' },
  iron_ore: { color: '#d1b4a1', altColor: '#888888', label: 'Iron Ore', icon: '⚪' },
  gold_ore: { color: '#facc15', altColor: '#888888', label: 'Gold Ore', icon: '🟡' },
  diamond_ore: { color: '#22d3ee', altColor: '#888888', label: 'Diamond Ore', icon: '💎' },
  emerald_ore: { color: '#10b981', altColor: '#888888', label: 'Emerald Ore', icon: '✳️' },
  obsidian: { color: '#1e1b4b', altColor: '#000000', label: 'Obsidian', icon: '🌑' },
  netherrack: { color: '#7f1d1d', altColor: '#450a0a', label: 'Netherrack', icon: '🔥' },
  soul_sand: { color: '#451a03', altColor: '#2a1202', label: 'Soul Sand', icon: '👻' },
  glowstone: { color: '#fef08a', altColor: '#eab308', label: 'Glowstone', icon: '💡', emissive: '#fef08a' },
  magma: { color: '#f97316', altColor: '#ea580c', label: 'Magma Block', icon: '🌋', emissive: '#f97316' },
  end_stone: { color: '#fef9c3', altColor: '#eab308', label: 'End Stone', icon: '🌑' },
  purpur: { color: '#d8b4fe', altColor: '#a855f7', label: 'Purpur', icon: '🟣' },
  portal_nether: { color: '#7e22ce', altColor: '#4c1d95', label: 'Nether Portal', icon: '🌀', transparent: true, emissive: '#7e22ce' },
  portal_end: { color: '#000000', altColor: '#1e1b4b', label: 'End Portal', icon: '🌌', transparent: true, emissive: '#1e1b4b' },
  apple: { color: '#ef4444', altColor: '#dc2626', label: 'Apple', icon: '🍎', nonPlaceable: true },
  raw_beef: { color: '#fca5a5', altColor: '#ef4444', label: 'Raw Beef', icon: '🥩', nonPlaceable: true },
  cooked_beef: { color: '#7c2d12', altColor: '#451a03', label: 'Cooked Beef', icon: '🍖', nonPlaceable: true },
  iron_sword: { color: '#d1d5db', altColor: '#9ca3af', label: 'Iron Sword', icon: '🗡️', nonPlaceable: true },
  diamond_pickaxe: { color: '#22d3ee', altColor: '#0891b2', label: 'Diamond Pickaxe', icon: '⛏️', nonPlaceable: true },
};

export const CHUNK_SIZE = 16;
export const MAX_HEALTH = 20;
export const MAX_HUNGER = 20;
