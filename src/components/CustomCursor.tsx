import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const CustomCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Emit light trail sparks on movement
      if (Math.random() > 0.4) {
        createParticle(e.clientX, e.clientY, false);
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      // Big spark explosion on click
      for (let i = 0; i < 24; i++) {
        createParticle(e.clientX, e.clientY, true);
      }
    };

    const createParticle = (x: number, y: number, isExplosion: boolean) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = isExplosion ? Math.random() * 5 + 2 : Math.random() * 1.5 + 0.5;
      const size = isExplosion ? Math.random() * 5 + 2 : Math.random() * 3 + 1;
      const maxLife = isExplosion ? Math.random() * 40 + 20 : Math.random() * 20 + 10;
      
      const colors = ['#FF5A00', '#FF7A00', '#FF9F00', '#8B0000', '#D4AF37'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (isExplosion ? 0 : (Math.random() - 0.5) * 0.5),
        vy: Math.sin(angle) * speed + (isExplosion ? -1.5 : -1), // float upward slightly
        size,
        color,
        alpha: 1,
        life: 0,
        maxLife
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);

    // Track when hovering buttons or links
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('interactive')
      ) {
        isHoveredRef.current = true;
      } else {
        isHoveredRef.current = false;
      }
    };
    window.addEventListener('mouseover', handleMouseOver);

    // Animation Loop
    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lerp custom cursor position for elastic physics
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;
      
      const ease = isHoveredRef.current ? 0.25 : 0.15;
      cursorRef.current.x += (targetX - cursorRef.current.x) * ease;
      cursorRef.current.y += (targetY - cursorRef.current.y) * ease;

      // Draw particle trail
      particlesRef.current.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        // Sparkle glow
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      // Filter out dead particles
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

      // Draw Main Cursor Circle
      ctx.save();
      ctx.beginPath();
      
      const radius = isHoveredRef.current ? 16 : 8;
      ctx.arc(cursorRef.current.x, cursorRef.current.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isHoveredRef.current ? '#FF7A00' : '#FF5A00';
      ctx.lineWidth = 2;
      ctx.shadowBlur = isHoveredRef.current ? 20 : 8;
      ctx.shadowColor = '#FF5A00';
      ctx.stroke();

      // Draw Inner Dot
      ctx.beginPath();
      ctx.arc(cursorRef.current.x, cursorRef.current.y, isHoveredRef.current ? 4 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isHoveredRef.current ? '#D4AF37' : '#FF5A00';
      ctx.fill();
      
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] hidden lg:block"
    />
  );
};

export default CustomCursor;
