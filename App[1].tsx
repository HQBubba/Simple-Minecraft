import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
// Fix: Changed Clouds to Cloud because it accepts opacity, speed, and other cloud-specific props directly.
import { Sky, Stars, Cloud } from '@react-three/drei';
import { Vector3, Color } from 'three';
import { BlockType, GameState, InventoryItem, ChunkData, Dimension, Entity } from './types';
import { BLOCKS, MAX_HEALTH, MAX_HUNGER, CHUNK_SIZE } from './constants';
import { Player } from './components/Player';
import { World } from './components/World';
import { SelectionBox } from './components/SelectionBox';
import { Mob } from './components/Mob';
import { useKeyboard } from './hooks/useKeyboard';
import { createNoise2D } from './utils/noise';

const RENDER_DIST = 3;

const App: React.FC = () => {
  const [chunks, setChunks] = useState<Map<string, ChunkData>>(new Map());
  const [health, setHealth] = useState(MAX_HEALTH);
  const [hunger, setHunger] = useState(MAX_HUNGER);
  const [dimension, setDimension] = useState<Dimension>('overworld');
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  const [activeSlot, setActiveSlot] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  
  const [inventory, setInventory] = useState<(InventoryItem | null)[]>(
    Array(36).fill(null).map((_, i) => {
      const keys = Object.keys(BLOCKS) as BlockType[];
      if (i < 9) return { type: keys[i], count: 64 };
      return null;
    })
  );

  const keys = useKeyboard();
  const playerPosRef = useRef(new Vector3(0, 35, 0));
  const noise = useMemo(() => createNoise2D(), []);

  // Generate terrain based on current dimension
  const generateChunk = useCallback((cx: number, cz: number, dim: Dimension) => {
    const data: ChunkData = new Map();
    const wx_start = cx * CHUNK_SIZE;
    const wz_start = cz * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = wx_start + x;
        const wz = wz_start + z;

        if (dim === 'overworld') {
          const h = Math.floor(noise(wx * 0.05, wz * 0.05) * 10) + 15;
          for (let y = 0; y <= h; y++) {
            let type: BlockType = 'stone';
            if (y === h) type = 'grass';
            else if (y > h - 3) type = 'dirt';
            
            // Ores
            if (y < 10 && Math.random() < 0.02) type = 'diamond_ore';
            else if (y < 15 && Math.random() < 0.04) type = 'iron_ore';
            else if (y < 20 && Math.random() < 0.08) type = 'coal_ore';

            data.set(`${wx},${y},${wz}`, type);
          }
          // Bedrock floor
          data.set(`${wx},0,${wz}`, 'bedrock');

          // Trees & Structures
          if (Math.random() > 0.995) {
            for (let ty = 1; ty < 6; ty++) data.set(`${wx},${h+ty},${wz}`, 'log');
            for (let lx = -2; lx <= 2; lx++) 
              for (let ly = 4; ly <= 6; ly++)
                for (let lz = -2; lz <= 2; lz++)
                  if (Math.abs(lx) + Math.abs(lz) < 3) data.set(`${wx+lx},${h+ly},${wz+lz}`, 'leaves');
          }

          // Random Village Hut (Simplified)
          if (Math.random() > 0.999) {
            for(let hx=0; hx<4; hx++) for(let hz=0; hz<4; hz++) {
              for(let hy=1; hy<4; hy++) {
                if(hx===0 || hx===3 || hz===0 || hz===3) data.set(`${wx+hx},${h+hy},${wz+hz}`, 'cobblestone');
              }
              data.set(`${wx+hx},${h+4},${wz+hz}`, 'wood');
            }
          }
        } else if (dim === 'nether') {
          // Nether logic: Ceiling and Floor with noise
          const floorH = Math.floor(noise(wx * 0.1, wz * 0.1) * 8) + 5;
          const ceilH = 40 - Math.floor(noise(wx * 0.1 + 100, wz * 0.1 + 100) * 8);
          for (let y = 0; y <= floorH; y++) data.set(`${wx},${y},${wz}`, Math.random() > 0.1 ? 'netherrack' : 'soul_sand');
          for (let y = ceilH; y <= 40; y++) data.set(`${wx},${y},${wz}`, 'netherrack');
          if (Math.random() > 0.98) data.set(`${wx},${floorH + 1},${wz}`, 'glowstone');
          if (Math.random() > 0.95) data.set(`${wx},${floorH},${wz}`, 'magma');
        } else if (dim === 'end') {
          // End logic: Floating Islands
          const centerDist = Math.sqrt(wx*wx + wz*wz);
          if (centerDist < 50 || (centerDist > 100 && noise(wx*0.05, wz*0.05) > 0.4)) {
            const hBase = 20;
            const hVar = Math.floor(noise(wx*0.1, wz*0.1) * 5);
            for(let y = hBase - hVar; y <= hBase; y++) data.set(`${wx},${y},${wz}`, 'end_stone');
            if (centerDist > 120 && Math.random() > 0.99) {
               // End City Pillar
               for(let py=1; py<10; py++) data.set(`${wx},${hBase+py},${wz}`, 'purpur');
            }
          }
        }
      }
    }
    return data;
  }, [noise]);

  // Handle Dimension Swapping
  const teleport = useCallback((target: Dimension) => {
    setDimension(target);
    setChunks(new Map()); // Clear current chunks to trigger regeneration
    playerPosRef.current.set(0, 40, 0); // Reset player to center
  }, []);

  // Sync chunks
  useEffect(() => {
    const px = Math.floor(playerPosRef.current.x / CHUNK_SIZE);
    const pz = Math.floor(playerPosRef.current.z / CHUNK_SIZE);
    
    setChunks(prev => {
      const next = new Map(prev);
      let changed = false;
      for (let x = -RENDER_DIST; x <= RENDER_DIST; x++) {
        for (let z = -RENDER_DIST; z <= RENDER_DIST; z++) {
          const key = `${px + x},${pz + z}`;
          if (!next.has(key)) {
            next.set(key, generateChunk(px + x, pz + z, dimension));
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [playerPosRef.current.x, playerPosRef.current.z, generateChunk, dimension]);

  // Hunger & Health logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState === GameState.PLAYING) {
        setHunger(h => Math.max(0, h - 0.05));
        if (hunger <= 0) setHealth(h => Math.max(0, h - 1));
        if (hunger > 18 && health < MAX_HEALTH) setHealth(h => Math.min(MAX_HEALTH, h + 0.5));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [gameState, hunger, health]);

  const onBlockInteract = useCallback((pos: [number, number, number], action: 'add' | 'remove', normal?: Vector3) => {
    const [x, y, z] = pos;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunkKey = `${cx},${cz}`;

    setChunks(prev => {
      const next = new Map(prev);
      const chunk = next.get(chunkKey);
      if (!chunk) return prev;

      const newChunk = new Map(chunk);
      if (action === 'remove') {
        const type = newChunk.get(`${x},${y},${z}`);
        if (type === 'portal_nether') teleport('nether');
        else if (type === 'portal_end') teleport('end');
        newChunk.delete(`${x},${y},${z}`);
      } else if (action === 'add' && normal) {
        const nx = x + Math.round(normal.x);
        const ny = y + Math.round(normal.y);
        const nz = z + Math.round(normal.z);
        
        const item = inventory[activeSlot];
        if (item && !BLOCKS[item.type].nonPlaceable) {
          const ncx = Math.floor(nx / CHUNK_SIZE);
          const ncz = Math.floor(nz / CHUNK_SIZE);
          const nKey = `${ncx},${ncz}`;
          
          if (ncx === cx && ncz === cz) {
            newChunk.set(`${nx},${ny},${nz}`, item.type);
          } else {
            const neighbor = new Map(next.get(nKey) || new Map());
            neighbor.set(`${nx},${ny},${nz}`, item.type);
            next.set(nKey, neighbor);
          }
        }
      }
      next.set(chunkKey, newChunk);
      return next;
    });
  }, [inventory, activeSlot, teleport]);

  return (
    <div className="w-full h-screen relative bg-[#0a0a0a] font-mono select-none overflow-hidden">
      <Canvas shadows camera={{ fov: 75 }}>
        {dimension === 'overworld' ? (
          <>
            <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
            {/* Fix: Changed Clouds to Cloud as the provided props (opacity, speed, etc.) are valid for Cloud, not Clouds. */}
            <Cloud opacity={0.5} speed={0.4} width={100} depth={1.5} segments={20} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
          </>
        ) : dimension === 'nether' ? (
          <>
            <color attach="background" args={['#2a0a0a']} />
            <fog attach="fog" args={['#2a0a0a', 5, 40]} />
            <ambientLight intensity={0.2} color="#ff3300" />
            <pointLight position={[0, 20, 0]} intensity={2} color="#ff6600" />
          </>
        ) : (
          <>
            <color attach="background" args={['#050505']} />
            <Stars radius={100} count={1000} speed={0.1} />
            <ambientLight intensity={0.1} color="#5b21b6" />
            <pointLight position={[0, 50, 0]} intensity={1} color="#d8b4fe" />
          </>
        )}
        
        <Player 
          chunks={chunks} 
          gameState={gameState} 
          onDamage={(amt) => setHealth(h => Math.max(0, h - amt))} 
          playerPosRef={playerPosRef} 
        />
        
        <World chunks={chunks} onBlockInteract={onBlockInteract} />
        <SelectionBox />

        {/* Mobs */}
        {entities.map(e => (
          <Mob key={e.id} type={e.type} position={e.position} playerPosition={playerPosRef.current} onAttack={() => setHealth(h => h - 2)} />
        ))}
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-full h-[2px] bg-white/60 absolute"></div>
            <div className="h-full w-[2px] bg-white/60 absolute"></div>
        </div>
      </div>

      {/* Survival Stats */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-center pb-2 pointer-events-none">
        <div className="w-[364px] flex justify-between mb-1 px-1">
          {/* Health Bar */}
          <div className="flex gap-[1px]">
            {Array(10).fill(0).map((_, i) => {
              const full = health > (i * 2) + 1;
              const half = health > (i * 2);
              return (
                <div key={i} className="text-sm drop-shadow" style={{ color: half ? '#ff0000' : '#222' }}>
                  {full ? '❤️' : (half ? '💔' : '🖤')}
                </div>
              );
            })}
          </div>
          {/* Hunger Bar */}
          <div className="flex gap-[1px] flex-row-reverse">
            {Array(10).fill(0).map((_, i) => {
              const full = hunger > (i * 2) + 1;
              const half = hunger > (i * 2);
              return (
                <div key={i} className="text-sm drop-shadow" style={{ color: half ? '#fbbf24' : '#222' }}>
                  {half ? '🍗' : '🦴'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hotbar */}
        <div className="flex bg-[#1e1e1e]/90 border-[4px] border-[#8b8b8b] p-1 gap-1 items-center">
          {inventory.slice(0, 9).map((item, i) => (
            <div key={i} className={`w-12 h-12 flex items-center justify-center relative bg-[#8b8b8b]/30 border-2 ${activeSlot === i ? 'border-white scale-110 z-10 bg-[#8b8b8b]/60' : 'border-transparent'}`}>
              {item && (
                <>
                  <span className="text-3xl">{BLOCKS[item.type].icon}</span>
                  <span className="absolute bottom-0 right-0 text-[10px] text-white bg-black/50 px-1 font-bold">{item.count}</span>
                </>
              )}
              <span className="absolute top-0 left-0 text-[8px] text-gray-500 p-0.5">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Death Screen */}
      {health <= 0 && (
        <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-white backdrop-blur-md">
          <h1 className="text-7xl font-black mb-8 italic tracking-tighter drop-shadow-2xl">YOU DIED!</h1>
          <button onClick={() => window.location.reload()} className="bg-[#8b8b8b] border-4 border-t-white border-l-white border-r-black border-b-black px-16 py-4 font-bold text-xl hover:bg-white/20 transition-all uppercase">Respawn</button>
        </div>
      )}

      {/* Dimension indicator */}
      <div className="absolute top-4 left-4 text-white font-bold bg-black/40 px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-white/20 pointer-events-none">
        {dimension}
      </div>
    </div>
  );
};

export default App;