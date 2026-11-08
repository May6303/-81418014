import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Weapon,
  BalloonTarget,
  TinCanTarget,
  MovingDuckTarget,
  EasterEggTarget,
  FloatingText,
  Particle,
  BalloonColor,
} from '../types/game';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ShootingBoothProps {
  weapon: Weapon;
  ammo: number;
  isReloading: boolean;
  onFire: (hit: boolean, points: number, targetType: string) => void;
  onMiss: () => void;
  onReload: () => void;
  currentCombo: number;
  triggerShake: boolean;
  onOwnerQuote: (quote: string) => void;
}

export const ShootingBooth: React.FC<ShootingBoothProps> = ({
  weapon,
  ammo,
  isReloading,
  onFire,
  onMiss,
  onReload,
  currentCombo,
  onOwnerQuote,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Crosshair coordinates
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [isInside, setIsInside] = useState(false);
  const [isFiringVisual, setIsFiringVisual] = useState(false);
  const [shake, setShake] = useState(false);

  // Targets state
  const [balloons, setBalloons] = useState<BalloonTarget[]>([]);
  const [cans, setCans] = useState<TinCanTarget[]>([]);
  const [ducks, setDucks] = useState<MovingDuckTarget[]>([]);
  const [easterEgg, setEasterEgg] = useState<EasterEggTarget>({
    id: 'roach-1',
    x: -10,
    y: 84,
    targetX: 110,
    targetY: 84,
    speed: 18,
    active: false,
    hit: false,
    points: 500,
    type: 'roach',
  });

  // Dynamic visual effects
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastShotTimeRef = useRef<number>(0);

  // Initialize targets
  const initBalloons = useCallback(() => {
    const rows = 4;
    const cols = 5;
    const list: BalloonTarget[] = [];
    const colors: BalloonColor[] = [
      'red',
      'blue',
      'green',
      'yellow',
      'purple',
      'gold',
      'bomb',
      'mystery',
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Deterministic special balloon distribution
        let color: BalloonColor = colors[(r * cols + c) % 5];
        if (r === 1 && c === 2) color = 'bomb';
        else if (r === 2 && c === 4) color = 'gold';
        else if (r === 0 && c === 0) color = 'mystery';
        else if (r === 3 && c === 1) color = 'gold';

        list.push({
          id: `b-${r}-${c}`,
          row: r,
          col: c,
          // Position inside the cork board area (top-left roughly 8% to 62% x, 18% to 68% y)
          x: 10 + c * 10.5,
          y: 20 + r * 12.5,
          radius: 3.8,
          color,
          popped: false,
          points: color === 'gold' ? 300 : color === 'bomb' ? 250 : color === 'mystery' ? 200 : 100,
          wobbleOffset: Math.random() * Math.PI * 2,
        });
      }
    }
    setBalloons(list);
  }, []);

  const initCans = useCallback(() => {
    // 6-can pyramid on the right shelf: 3 bottom, 2 middle, 1 top
    const drinkBrands = [
      { name: '沙士', color: '#7f1d1d' },
      { name: '冬瓜', color: '#14532d' },
      { name: '蘋果', color: '#b91c1c' },
      { name: '仙草', color: '#1e293b' },
      { name: '芭樂', color: '#854d0e' },
      { name: '蘆筍', color: '#047857' },
    ];

    const list: TinCanTarget[] = [
      // Row 0 (bottom 3 cans)
      { id: 'can-0-0', row: 0, col: 0, x: 74, y: 55, vx: 0, vy: 0, rotation: 0, vRot: 0, knocked: false, points: 120, color: drinkBrands[0].color, label: drinkBrands[0].name },
      { id: 'can-0-1', row: 0, col: 1, x: 81, y: 55, vx: 0, vy: 0, rotation: 0, vRot: 0, knocked: false, points: 120, color: drinkBrands[1].color, label: drinkBrands[1].name },
      { id: 'can-0-2', row: 0, col: 2, x: 88, y: 55, vx: 0, vy: 0, rotation: 0, vRot: 0, knocked: false, points: 120, color: drinkBrands[2].color, label: drinkBrands[2].name },
      // Row 1 (middle 2 cans)
      { id: 'can-1-0', row: 1, col: 0, x: 77.5, y: 44, vx: 0, vy: 0, rotation: 0, vRot: 0, knocked: false, points: 150, color: drinkBrands[3].color, label: drinkBrands[3].name },
      { id: 'can-1-1', row: 1, col: 1, x: 84.5, y: 44, vx: 0, vy: 0, rotation: 0, vRot: 0, knocked: false, points: 150, color: drinkBrands[4].color, label: drinkBrands[4].name },
      // Row 2 (top 1 can)
      { id: 'can-2-0', row: 2, col: 0, x: 81, y: 33, vx: 0, vy: 0, rotation: 0, vRot: 0, knocked: false, points: 200, color: drinkBrands[5].color, label: drinkBrands[5].name },
    ];
    setCans(list);
  }, []);

  const initDucks = useCallback(() => {
    // 4 swimming rubber ducks on lower stream
    const list: MovingDuckTarget[] = [
      { id: 'duck-1', x: 5, y: 72, speed: 8, direction: 1, points: 150, hit: false, duckType: 'yellow' },
      { id: 'duck-2', x: 35, y: 72, speed: 12, direction: 1, points: 150, hit: false, duckType: 'yellow' },
      { id: 'duck-3', x: 65, y: 72, speed: 9, direction: 1, points: 300, hit: false, duckType: 'gold' },
      { id: 'duck-4', x: 90, y: 72, speed: 14, direction: 1, points: 150, hit: false, duckType: 'yellow' },
    ];
    setDucks(list);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initBalloons();
    initCans();
    initDucks();
  }, [initBalloons, initCans, initDucks]);

  // Respawn balloon after pop
  const respawnBalloon = useCallback((id: string) => {
    setTimeout(() => {
      setBalloons((prev) =>
        prev.map((b) => (b.id === id ? { ...b, popped: false } : b))
      );
    }, 2800);
  }, []);

  // Respawn cans if all knocked down
  useEffect(() => {
    const allKnocked = cans.length > 0 && cans.every((c) => c.knocked);
    if (allKnocked) {
      sound.playJackpot();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.8, y: 0.5 },
      });
      addFloatingText('鐵罐全倒！+500', 81, 40, '#facc15', 1.4);
      onOwnerQuote('「鐵罐全倒！太強了，滿分大熊在向你招手了！」');

      const timer = setTimeout(() => {
        initCans();
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [cans, initCans, onOwnerQuote]);

  // Floating text helper
  const addFloatingText = (
    text: string,
    x: number,
    y: number,
    color = '#fde047',
    scale = 1
  ) => {
    const id = `txt-${Date.now()}-${Math.random()}`;
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color, scale, createdAt: Date.now() }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1000);
  };

  // Add explosion particles
  const addParticles = (x: number, y: number, color: string, count = 16) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = (x / 100) * rect.width;
    const pixelY = (y / 100) * rect.height;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particlesRef.current.push({
        x: pixelX,
        y: pixelY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
      });
    }
  };

  // Easter egg roach spawner logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.35 && !easterEgg.active) {
        setEasterEgg({
          id: `roach-${Date.now()}`,
          x: -8,
          y: 83.5,
          targetX: 108,
          targetY: 83.5,
          speed: 25 + Math.random() * 15,
          active: true,
          hit: false,
          points: 500,
          type: 'roach',
        });
      }
    }, 9000);
    return () => clearInterval(interval);
  }, [easterEgg.active]);

  // Main animation loop: Canvas particles, Ducks movement, Cans physics, Roach
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // 1. Move ducks
      setDucks((prev) =>
        prev.map((duck) => {
          if (duck.hit) {
            // Respawn after 2 seconds
            if (duck.hitTime && time - duck.hitTime > 2200) {
              return { ...duck, hit: false, x: -10, hitTime: undefined };
            }
            return duck;
          }
          let newX = duck.x + duck.speed * dt * duck.direction;
          if (newX > 105) newX = -10;
          return { ...duck, x: newX };
        })
      );

      // 2. Move Easter Egg Roach
      setEasterEgg((prev) => {
        if (!prev.active || prev.hit) return prev;
        const newX = prev.x + prev.speed * dt;
        if (newX > prev.targetX) {
          return { ...prev, active: false };
        }
        return { ...prev, x: newX };
      });

      // 3. Update Cans Falling Physics
      setCans((prev) =>
        prev.map((can) => {
          if (!can.knocked && (can.vx !== 0 || can.vy !== 0)) {
            // Apply gravity and tumbling
            const newVy = can.vy + 40 * dt;
            const newX = can.x + can.vx * dt;
            const newY = can.y + newVy * dt;
            const newRot = can.rotation + can.vRot * dt;

            // Stop at floor
            if (newY > 78) {
              return {
                ...can,
                knocked: true,
                y: 78,
                vx: can.vx * 0.4,
                vy: 0,
                vRot: 0,
              };
            }
            return {
              ...can,
              x: newX,
              y: newY,
              vy: newVy,
              rotation: newRot,
            };
          }
          return can;
        })
      );

      // 4. Render Particles on Canvas
      const canvas = canvasRef.current;
      if (canvas && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          particlesRef.current.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // gravity
            p.life++;
            p.alpha = Math.max(0, 1 - p.life / p.maxLife);
            p.rotation += p.vRot;

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;

            if (p.shape === 'square') {
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          });

          // Remove dead particles
          particlesRef.current = particlesRef.current.filter(
            (p) => p.life < p.maxLife
          );
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update crosshair on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCrosshairPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  // Touch move for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setCrosshairPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  // Explode bomb balloon and chain-burst neighbors
  const triggerBombExplosion = (bomb: BalloonTarget) => {
    sound.playBalloonPop(true);
    addParticles(bomb.x, bomb.y, '#f97316', 30);
    addFloatingText('連環大爆破！+250', bomb.x, bomb.y - 4, '#fb923c', 1.3);

    // Find all adjacent balloons within 15% distance
    setBalloons((prev) =>
      prev.map((b) => {
        if (!b.popped && b.id !== bomb.id) {
          const dist = Math.hypot(b.x - bomb.x, b.y - bomb.y);
          if (dist < 18) {
            respawnBalloon(b.id);
            addParticles(b.x, b.y, getBalloonHex(b.color), 14);
            return { ...b, popped: true };
          }
        }
        return b;
      })
    );
  };

  // The core shooting handler
  const handleShoot = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const now = performance.now();

    // Check weapon fire rate
    if (now - lastShotTimeRef.current < weapon.fireRateMs) {
      return;
    }

    // Check reloading state
    if (isReloading) {
      sound.playDryFire();
      return;
    }

    // Check ammo
    if (ammo <= 0) {
      sound.playDryFire();
      onReload();
      onOwnerQuote('「沒子彈了！快拉動槍機裝填子彈！」');
      return;
    }

    lastShotTimeRef.current = now;

    // Visual recoil & sound
    sound.playShot(weapon.id);
    setIsFiringVisual(true);
    setShake(true);
    setTimeout(() => setIsFiringVisual(false), 90);
    setTimeout(() => setShake(false), 120);

    // Target coordinates
    const targetX = crosshairPos.x;
    const targetY = crosshairPos.y;
    // Calculate radius in % based on weapon hitRadius
    const hitRadiusPercent = (weapon.hitRadius / 800) * 100;

    let hitSomething = false;
    let earnedPoints = 0;
    let targetType = 'none';

    // 1. Check Easter Egg Roach first (tiny fast priority)
    if (easterEgg.active && !easterEgg.hit) {
      const dist = Math.hypot(targetX - easterEgg.x, targetY - easterEgg.y);
      if (dist < 3.5 + hitRadiusPercent * 0.4) {
        sound.playJackpot();
        setEasterEgg((prev) => ({ ...prev, hit: true, active: false }));
        addParticles(easterEgg.x, easterEgg.y, '#22c55e', 24);
        addFloatingText('神狙擊！消滅害蟲 +500', easterEgg.x, easterEgg.y - 5, '#4ade80', 1.4);
        onOwnerQuote('「太扯了！居然一槍把逃跑的小強打爆！這身手太強啦！」');
        earnedPoints += 500;
        hitSomething = true;
        targetType = 'roach';
      }
    }

    // 2. Check Balloons
    if (!hitSomething) {
      // Find closest unpopped balloon
      let closestBalloon: BalloonTarget | null = null;
      let minBalloonDist = Infinity;

      for (const b of balloons) {
        if (!b.popped) {
          const dist = Math.hypot(targetX - b.x, targetY - b.y);
          if (dist < b.radius + hitRadiusPercent && dist < minBalloonDist) {
            minBalloonDist = dist;
            closestBalloon = b;
          }
        }
      }

      if (closestBalloon) {
        hitSomething = true;
        targetType = 'balloon';
        const balloon = closestBalloon;

        // Pop sound and points
        sound.playBalloonPop(balloon.color === 'gold' || balloon.color === 'bomb');
        earnedPoints = Math.round(balloon.points * weapon.scoreMultiplier);

        // Special balloon effects
        if (balloon.color === 'bomb') {
          triggerBombExplosion(balloon);
        } else if (balloon.color === 'mystery') {
          addFloatingText('問號驚喜！+200', balloon.x, balloon.y - 3, '#c084fc', 1.2);
          addParticles(balloon.x, balloon.y, '#c084fc', 20);
        } else if (balloon.color === 'gold') {
          addFloatingText('黃金氣球！+300', balloon.x, balloon.y - 3, '#facc15', 1.3);
          addParticles(balloon.x, balloon.y, '#eab308', 25);
        } else {
          addFloatingText(`+${earnedPoints}`, balloon.x, balloon.y - 3, getBalloonHex(balloon.color));
          addParticles(balloon.x, balloon.y, getBalloonHex(balloon.color), 16);
        }

        // Mark popped & schedule respawn
        setBalloons((prev) =>
          prev.map((b) => (b.id === balloon.id ? { ...b, popped: true } : b))
        );
        respawnBalloon(balloon.id);
      }
    }

    // 3. Check Tin Cans
    if (!hitSomething) {
      let hitCan: TinCanTarget | null = null;
      for (const can of cans) {
        if (!can.knocked) {
          const dist = Math.hypot(targetX - can.x, targetY - can.y);
          if (dist < 4.2 + hitRadiusPercent) {
            hitCan = can;
            break;
          }
        }
      }

      if (hitCan) {
        hitSomething = true;
        targetType = 'can';
        sound.playCanHit(1 + Math.random() * 0.3);

        const impulseX = (targetX > hitCan.x ? -1 : 1) * (15 + weapon.knockback * 10);
        const impulseY = -(12 + weapon.knockback * 8);
        const rot = (Math.random() - 0.5) * 8;

        earnedPoints = Math.round(hitCan.points * weapon.scoreMultiplier);
        addFloatingText(`擊倒鐵罐! +${earnedPoints}`, hitCan.x, hitCan.y - 4, '#38bdf8');
        addParticles(hitCan.x, hitCan.y, '#cbd5e1', 18);

        // Update the hit can with velocity
        setCans((prev) =>
          prev.map((c) =>
            c.id === hitCan!.id
              ? {
                  ...c,
                  vx: impulseX,
                  vy: impulseY,
                  vRot: rot,
                }
              : c
          )
        );

        // Also check if knocking a bottom can knocks adjacent cans
        if (hitCan.row === 0) {
          setCans((prev) =>
            prev.map((c) => {
              if (!c.knocked && c.row > 0 && Math.abs(c.x - hitCan!.x) < 6) {
                return {
                  ...c,
                  vx: impulseX * 0.6,
                  vy: impulseY * 0.5,
                  vRot: rot * 0.8,
                };
              }
              return c;
            })
          );
        }
      }
    }

    // 4. Check Moving Ducks
    if (!hitSomething) {
      for (const duck of ducks) {
        if (!duck.hit) {
          const dist = Math.hypot(targetX - duck.x, targetY - duck.y);
          if (dist < 4.5 + hitRadiusPercent) {
            hitSomething = true;
            targetType = 'duck';
            sound.playDuckHit();
            earnedPoints = Math.round(duck.points * weapon.scoreMultiplier);
            addFloatingText(`命中水流鴨! +${earnedPoints}`, duck.x, duck.y - 4, '#fbbf24', 1.2);
            addParticles(duck.x, duck.y, duck.duckType === 'gold' ? '#f59e0b' : '#fde047', 18);

            setDucks((prev) =>
              prev.map((d) =>
                d.id === duck.id
                  ? { ...d, hit: true, hitTime: performance.now() }
                  : d
              )
            );
            break;
          }
        }
      }
    }

    // Report result to parent
    if (hitSomething) {
      onFire(true, earnedPoints, targetType);
    } else {
      // Missed shot
      addParticles(targetX, targetY, '#78716c', 6);
      onMiss();
    }
  };

  // Helper for balloon CSS colors
  const getBalloonHex = (color: BalloonColor): string => {
    switch (color) {
      case 'red':
        return '#ef4444';
      case 'blue':
        return '#3b82f6';
      case 'green':
        return '#22c55e';
      case 'yellow':
        return '#eab308';
      case 'purple':
        return '#a855f7';
      case 'gold':
        return '#fbbf24';
      case 'bomb':
        return '#374151';
      case 'mystery':
        return '#8b5cf6';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsInside(true)}
      onMouseLeave={() => setIsInside(false)}
      onTouchMove={handleTouchMove}
      onClick={handleShoot}
      onContextMenu={(e) => {
        e.preventDefault();
        onReload();
      }}
      className={`relative w-full aspect-[16/10] max-h-[74vh] overflow-hidden rounded-xl border-4 border-amber-950 bg-stone-900 select-none shadow-2xl game-active-crosshair transition-transform ${
        shake ? 'translate-x-[2px] translate-y-[-2px]' : ''
      }`}
    >
      {/* 1. Striped Awning Top (Classic Night Market Stall Roof) */}
      <div className="absolute top-0 left-0 right-0 h-10 md:h-12 awning-stripes shadow-md z-20 flex items-center justify-between px-6 border-b-2 border-red-900">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-300 animate-pulse shadow-sm" />
          <span className="text-yellow-300 font-black text-xs md:text-sm tracking-wider drop-shadow-md">
            ★ 夜市神射手 · 百步穿楊 ★
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-yellow-200">
          <span className="hidden sm:inline bg-red-900/80 px-2 py-0.5 rounded border border-red-700">
            滿分送 2米巨型泰迪熊
          </span>
          <div className="w-3 h-3 rounded-full bg-amber-300 animate-pulse shadow-sm" />
        </div>
      </div>

      {/* 2. Hanging Red Lanterns & Lightbulbs */}
      <div className="absolute top-10 md:top-12 left-0 right-0 flex justify-around px-8 pointer-events-none z-20">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center animate-bounce" style={{ animationDuration: `${2.5 + i * 0.3}s` }}>
            <div className="w-0.5 h-4 bg-stone-700" />
            <div className="w-5 h-7 rounded-full bg-red-600 border border-yellow-400 shadow-lg flex items-center justify-center">
              <span className="text-[8px] text-yellow-300 font-bold">福</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_#f59e0b]" />
          </div>
        ))}
      </div>

      {/* 3. Wooden Wall Background & Shelf Structure */}
      <div className="absolute inset-0 bg-[#2b1810] bg-[radial-gradient(#451a03_1px,transparent_1px)] [background-size:16px_16px] z-0">
        {/* Cork Target Board (Left Area for Balloons) */}
        <div className="absolute top-[16%] left-[6%] w-[62%] h-[56%] bg-[#854d0e] rounded-lg border-4 border-[#5c3008] shadow-inner opacity-95">
          <div className="absolute inset-0 bg-[radial-gradient(#a16207_1px,transparent_1px)] [background-size:10px_10px] opacity-40" />
          {/* Neon Sign on Board */}
          <div className="absolute top-2 left-4 text-[10px] font-bold text-amber-300 tracking-wider font-arcade opacity-80">
            [ 彩色氣球連擊爆破區 ]
          </div>
        </div>

        {/* Metal Tin Can Pyramid Shelf (Right Area) */}
        <div className="absolute top-[30%] right-[5%] w-[25%] h-[42%] bg-[#1c120c] rounded border-2 border-stone-800 shadow-inner flex flex-col justify-end p-2">
          <div className="text-[10px] text-center font-bold text-sky-400 mb-1">
            [ 經典鐵罐倒台 ]
          </div>
          {/* Wooden Shelf Planks */}
          <div className="w-full h-2.5 wood-counter rounded shadow-md mt-auto" />
        </div>

        {/* Water Stream Conveyor Trough (Lower Mid Area for Ducks) */}
        <div className="absolute bottom-[13%] left-[5%] right-[5%] h-14 bg-cyan-950/80 border-t-2 border-b-2 border-cyan-700/60 rounded-md overflow-hidden shadow-inner flex items-center">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(6,182,212,0.15)_50%,transparent_100%)] animate-pulse" />
          <div className="absolute top-1 left-3 text-[9px] font-bold text-cyan-300 tracking-wider">
            ~ 旋轉水流小鴨區 ~
          </div>
        </div>

        {/* Front Wooden Counter Countertop (Foreground) */}
        <div className="absolute bottom-0 left-0 right-0 h-[14%] wood-counter z-20 flex items-center justify-between px-6 border-t-4 border-[#b45309]">
          <div className="flex items-center gap-2 text-stone-300 text-xs">
            <span className="font-bold text-amber-400">當前槍型:</span>
            <span>{weapon.name}</span>
            <span className="text-stone-400 font-mono">({weapon.ammoType})</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
            <span>[滑鼠左鍵] 射擊</span>
            <span>·</span>
            <span>[空白鍵 / R / 右鍵] 裝彈</span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Target Elements Layer (z-10) */}

      {/* A. Balloons Grid */}
      {balloons.map((b) => (
        <div
          key={b.id}
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: '6.5%',
            height: '11%',
            transform: 'translate(-50%, -50%)',
          }}
          className={`absolute flex flex-col items-center justify-center transition-transform pointer-events-none ${
            b.popped ? 'scale-0 opacity-0 duration-150' : 'scale-100 opacity-100 duration-300'
          }`}
        >
          {/* Balloon Body */}
          <div
            style={{
              backgroundColor: getBalloonHex(b.color),
            }}
            className={`relative w-8 h-10 md:w-11 md:h-13 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-lg flex items-center justify-center border border-white/20 ${
              b.color === 'bomb' ? 'animate-pulse' : ''
            }`}
          >
            {/* Balloon Gloss Highlight */}
            <div className="absolute top-1.5 left-2 w-2 h-3 rounded-full bg-white/40 rotate-[-25deg]" />

            {/* Special Badges */}
            {b.color === 'gold' && (
              <span className="text-yellow-100 text-xs font-black drop-shadow animate-bounce">
                ★
              </span>
            )}
            {b.color === 'bomb' && (
              <span className="text-white text-xs font-black drop-shadow">
                💣
              </span>
            )}
            {b.color === 'mystery' && (
              <span className="text-white text-xs font-black drop-shadow">
                ?
              </span>
            )}

            {/* Balloon Knot & String */}
            <div
              style={{ backgroundColor: getBalloonHex(b.color) }}
              className="absolute -bottom-1 w-1.5 h-1 rounded-sm"
            />
          </div>
          <div className="w-0.5 h-3 bg-stone-300 opacity-60" />
        </div>
      ))}

      {/* B. Tin Can Pyramid */}
      {cans.map((can) => (
        <div
          key={can.id}
          style={{
            left: `${can.x}%`,
            top: `${can.y}%`,
            transform: `translate(-50%, -50%) rotate(${can.rotation}rad)`,
          }}
          className={`absolute w-8 h-11 md:w-10 md:h-13 rounded shadow-md pointer-events-none flex flex-col items-center justify-between py-1 border border-stone-400 ${
            can.knocked ? 'opacity-80' : ''
          }`}
        >
          {/* Can Aluminum Top Rim */}
          <div className="w-full h-1.5 bg-stone-300 rounded-t-sm border-b border-stone-400" />
          
          {/* Can Label Body */}
          <div
            style={{ backgroundColor: can.color }}
            className="w-full flex-1 flex flex-col items-center justify-center text-[10px] font-black text-white shadow-inner"
          >
            <span>{can.label}</span>
          </div>

          {/* Can Bottom Rim */}
          <div className="w-full h-1.5 bg-stone-300 rounded-b-sm border-t border-stone-400" />
        </div>
      ))}

      {/* C. Moving Water Ducks */}
      {ducks.map((duck) => (
        <div
          key={duck.id}
          style={{
            left: `${duck.x}%`,
            top: `${duck.y}%`,
            transform: `translate(-50%, -50%) ${duck.hit ? 'scale-0 rotate-180 opacity-0' : 'scale-100 opacity-100'}`,
            transition: 'transform 0.25s, opacity 0.25s',
          }}
          className="absolute pointer-events-none flex flex-col items-center"
        >
          <div
            className={`w-9 h-7 md:w-11 md:h-8 rounded-full flex items-center justify-center shadow-md relative ${
              duck.duckType === 'gold' ? 'bg-amber-400 border border-amber-300' : 'bg-yellow-400 border border-yellow-300'
            }`}
          >
            {/* Duck Beak */}
            <div className="absolute -right-2 top-2 w-3 h-2 bg-orange-500 rounded-r-md" />
            {/* Duck Eye */}
            <div className="absolute right-1.5 top-1.5 w-1 h-1 bg-black rounded-full" />
            {/* Points Tag on side */}
            <span className="text-[9px] font-bold font-mono text-stone-900">
              +{duck.points}
            </span>
            {duck.duckType === 'gold' && (
              <span className="absolute -top-2 left-3 text-[10px]">👑</span>
            )}
          </div>
          {/* Water Splash Ripples */}
          <div className="w-10 h-1 bg-cyan-400/50 rounded-full mt-0.5 animate-ping" />
        </div>
      ))}

      {/* D. Easter Egg Cockroach Target */}
      {easterEgg.active && (
        <div
          style={{
            left: `${easterEgg.x}%`,
            top: `${easterEgg.y}%`,
            transform: `translate(-50%, -50%) ${easterEgg.hit ? 'scale-0' : 'scale-100'}`,
            transition: 'transform 0.15s',
          }}
          className="absolute z-30 pointer-events-none flex items-center"
        >
          <span className="text-xl md:text-2xl drop-shadow-md select-none">
            🪳
          </span>
          <span className="bg-red-600 text-yellow-300 text-[9px] font-bold px-1 rounded ml-1 animate-pulse">
            +500
          </span>
        </div>
      )}

      {/* 5. Particle Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
      />

      {/* 6. Floating Score Popup Texts */}
      {floatingTexts.map((ft) => (
        <div
          key={ft.id}
          style={{
            left: `${ft.x}%`,
            top: `${ft.y}%`,
            color: ft.color,
            transform: `translate(-50%, -50%) scale(${ft.scale || 1})`,
          }}
          className="absolute z-40 font-black font-arcade text-sm md:text-lg tracking-wider pointer-events-none drop-shadow-md animate-out fade-out slide-out-to-top duration-700"
        >
          {ft.text}
        </div>
      ))}

      {/* 7. Gun Model at Bottom Center-Right (Points toward cursor) */}
      <div
        style={{
          left: '60%',
          bottom: '-15px',
          transform: `translateX(-50%) rotate(${
            ((crosshairPos.x - 60) * 0.4)
          }deg) translateY(${isFiringVisual ? '12px' : '0px'})`,
          transition: 'transform 0.05s ease-out',
        }}
        className="absolute z-30 pointer-events-none flex flex-col items-center"
      >
        {/* Muzzle Flash Puff */}
        {isFiringVisual && (
          <div className="w-10 h-10 rounded-full bg-yellow-300/90 shadow-[0_0_20px_#f59e0b] animate-ping" />
        )}
        {/* Gun Barrel */}
        <div className="w-4 md:w-5 h-20 md:h-28 bg-gradient-to-r from-stone-600 via-stone-400 to-stone-700 rounded-t-sm shadow-2xl border-x border-stone-800" />
        {/* Gun Wooden Stock / Grip */}
        <div className="w-10 md:w-12 h-16 md:h-20 bg-gradient-to-b from-[#78350f] to-[#451a03] rounded-t-md shadow-2xl border border-amber-900" />
      </div>

      {/* 8. Precision Night Market Reticle / Crosshair */}
      {isInside && (
        <div
          style={{
            left: `${crosshairPos.x}%`,
            top: `${crosshairPos.y}%`,
            transform: `translate(-50%, -50%) scale(${isFiringVisual ? 1.3 : 1})`,
            transition: 'transform 0.08s ease-out',
          }}
          className="absolute z-50 pointer-events-none flex items-center justify-center"
        >
          {/* Outer Ring */}
          <div
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-colors ${
              currentCombo >= 3
                ? 'border-orange-500 shadow-[0_0_8px_#f97316]'
                : 'border-red-500 shadow-[0_0_6px_#ef4444]'
            } flex items-center justify-center`}
          >
            {/* Center Red Precision Pip */}
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {/* Crosshair Hairlines */}
            <div className="absolute w-full h-[1px] bg-red-500/80" />
            <div className="absolute h-full w-[1px] bg-red-500/80" />
          </div>

          {/* Hit Combo Flare */}
          {currentCombo > 1 && (
            <div className="absolute -top-4 text-[10px] font-black text-amber-300 font-mono">
              x{currentCombo}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
