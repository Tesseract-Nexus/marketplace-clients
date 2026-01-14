'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'star';
}

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
];

const SHAPES = ['square', 'circle', 'star'] as const;

export function Confetti({
  active = true,
  duration = 5000,
  pieceCount = 150
}: {
  active?: boolean;
  duration?: number;
  pieceCount?: number;
}) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (!active) return;

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.random() * 12,
      speedX: (Math.random() - 0.5) * 3,
      speedY: 2 + Math.random() * 4,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    }));

    setPieces(newPieces);
    setIsActive(true);

    // Stop after duration
    const timer = setTimeout(() => {
      setIsActive(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration, pieceCount]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.shape !== 'star' ? piece.color : 'transparent',
            borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '0',
            transform: `rotate(${piece.rotation}deg)`,
            animationDuration: `${3 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
            '--speed-x': piece.speedX,
            '--speed-y': piece.speedY,
            '--rotation-speed': piece.rotationSpeed,
          } as React.CSSProperties}
        >
          {piece.shape === 'star' && (
            <svg viewBox="0 0 24 24" fill={piece.color} className="w-full h-full">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </div>
      ))}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(calc(var(--speed-x) * 100px)) rotate(calc(var(--rotation-speed) * 360deg));
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}

export function FloralCelebration({ active = true }: { active?: boolean }) {
  const [show, setShow] = useState(active);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {/* Sparkle effects */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      ))}

      {/* Floating hearts/flowers */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`flower-${i}`}
          className="absolute animate-float-up text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-20px',
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${4 + Math.random() * 3}s`,
          }}
        >
          {['🌸', '✨', '🎉', '💫', '🌟', '🎊'][Math.floor(Math.random() * 6)]}
        </div>
      ))}

      <style jsx global>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-float-up {
          animation: float-up linear forwards;
        }
      `}</style>
    </div>
  );
}
