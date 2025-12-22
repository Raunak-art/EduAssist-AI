
import React, { useEffect, useRef } from 'react';

interface Santa {
  x: number;
  y: number;
  speed: number;
  scale: number;
  phase: number;
  trail: { x: number; y: number; opacity: number }[];
}

interface Gift {
  x: number;
  y: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

export const ChristmasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; radius: number; speed: number; opacity: number; swing: number }[] = [];
    let gifts: Gift[] = [];
    let santas: Santa[] = [];
    
    const snowflakeCount = 100;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < snowflakeCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.3,
          swing: Math.random() * 0.01 + 0.005
        });
      }
      gifts = [];
      santas = [];
    };

    const drawMoon = () => {
      ctx.save();
      const mx = canvas.width * 0.8;
      const my = canvas.height * 0.2;
      
      const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mx, my, 100, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f0f9ff';
      ctx.beginPath();
      ctx.arc(mx, my, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSpiralingTree = (x: number, y: number, scale: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(40, 0);
      for(let i = 0; i < 5; i++) {
        const width = 45 - (i * 9);
        const height = -15 - (i * 22);
        ctx.moveTo(-width, height + 15);
        ctx.quadraticCurveTo(0, height + 28, width, height + 15);
        ctx.quadraticCurveTo(width + 12, height, 0, height - 12);
        ctx.quadraticCurveTo(-width - 12, height, -width, height + 15);
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawGift = (gift: Gift) => {
      ctx.save();
      ctx.translate(gift.x, gift.y);
      ctx.rotate(gift.rotation);
      ctx.fillStyle = gift.color;
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -12, 4, 24);
      ctx.fillRect(-12, -2, 24, 4);
      ctx.restore();
    };

    const drawSantaFullSleigh = (santa: Santa) => {
      ctx.save();
      const wave = Math.sin(santa.phase) * 20;
      ctx.translate(santa.x, santa.y + wave);
      ctx.scale(santa.scale, santa.scale);

      // Sleigh Trail (Sparkles)
      santa.trail.forEach((p, i) => {
        ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x - santa.x, p.y - (santa.y + wave), 2 * santa.scale, 0, Math.PI * 2);
        ctx.fill();
        p.opacity -= 0.02;
      });
      santa.trail = santa.trail.filter(p => p.opacity > 0);

      // Reindeer Chain (5 pairs)
      for (let i = 0; i < 5; i++) {
        const rx = 100 + (i * 55);
        const ry = Math.sin(santa.phase + (i * 0.6)) * 12;
        
        ctx.fillStyle = '#78350f';
        // Body
        ctx.beginPath(); ctx.ellipse(rx, ry, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
        // Head
        ctx.beginPath(); ctx.ellipse(rx + 10, ry - 12, 6, 9, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
        
        // Galloping Legs
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        const legPhase = santa.phase * 5 + i;
        const frontLeg = Math.sin(legPhase) * 10;
        const backLeg = Math.cos(legPhase) * 10;
        
        ctx.beginPath();
        ctx.moveTo(rx + 5, ry + 4); ctx.lineTo(rx + 10 + frontLeg, ry + 14);
        ctx.moveTo(rx - 5, ry + 4); ctx.lineTo(rx - 10 + backLeg, ry + 14);
        ctx.stroke();

        // Reins
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(rx - 5, ry); ctx.stroke();

        if (i === 4) { // Rudolph
          ctx.fillStyle = '#ef4444';
          ctx.shadowBlur = 15; ctx.shadowColor = 'red';
          ctx.beginPath(); ctx.arc(rx + 16, ry - 14, 4, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Sledge / Sleigh
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-50, 20); ctx.lineTo(30, 20); ctx.lineTo(45, -10); ctx.lineTo(-40, -10);
      ctx.closePath(); ctx.fill();
      
      // Golden Ornate Trim
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-55, 25); ctx.lineTo(35, 25);
      ctx.quadraticCurveTo(50, 25, 55, 0);
      ctx.stroke();

      // Santa
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(0, -15, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fee2e2';
      ctx.beginPath(); ctx.arc(0, -32, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(0, -28, 10, 0, Math.PI, false); ctx.fill();
      
      // Waving
      ctx.strokeStyle = 'white'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-10, -15);
      ctx.lineTo(-25, -30 + Math.sin(santa.phase * 3) * 15);
      ctx.stroke();

      ctx.restore();
    };

    const draw = () => {
      if (document.visibilityState === 'hidden') {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawMoon();

      // Snowy Ground
      ctx.fillStyle = '#f0f9ff';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.9);
      ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.78, canvas.width, canvas.height * 0.92);
      ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.fill();

      // Trees
      drawSpiralingTree(canvas.width * 0.15, canvas.height * 0.88, 0.7);
      drawSpiralingTree(canvas.width * 0.85, canvas.height * 0.9, 0.9);

      // Snow
      ctx.fillStyle = 'white';
      particles.forEach(p => {
        ctx.beginPath(); ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        p.y += p.speed; p.x += Math.sin(p.y * p.swing) * 1.2;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      });
      ctx.globalAlpha = 1.0;

      // Santa Logic
      if (Math.random() < 0.003 && santas.length < 1) {
        santas.push({
          x: -600, y: Math.random() * (canvas.height * 0.3) + 100,
          speed: 5, scale: 1.1, phase: 0, trail: []
        });
      }

      santas = santas.filter(s => {
        if (Math.random() > 0.3) {
           s.trail.push({ x: s.x, y: s.y + Math.sin(s.phase) * 20, opacity: 0.8 });
        }
        drawSantaFullSleigh(s);
        s.x += s.speed; s.phase += 0.08;
        return s.x < canvas.width + 600;
      });

      // Gifts
      if (Math.random() < 0.008 && gifts.length < 8) {
        gifts.push({
          x: Math.random() * canvas.width, y: -40, speed: Math.random() * 2 + 1.5,
          rotation: 0, rotationSpeed: 0.04, color: ['#ffffff', '#fbbf24', '#0ea5e9'][Math.floor(Math.random()*3)]
        });
      }
      gifts = gifts.filter(g => {
        drawGift(g); g.y += g.speed; g.rotation += g.rotationSpeed;
        return g.y < canvas.height + 40;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    init(); draw();
    const handleResize = () => init();
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[0]" aria-hidden="true" />;
};
