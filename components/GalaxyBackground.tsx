
// Import React to fix namespace error
import React, { useEffect, useRef } from 'react';

export const GalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; size: number; opacity: number; twinkle: number; speed: number; color: string }[] = [];
    let shootingStars: { x: number; y: number; len: number; speed: number; opacity: number; width: number }[] = [];
    
    const starColors = ['#ffffff', '#e0e7ff', '#fef3c7', '#fae8ff'];
    const starCount = 200;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.3,
          opacity: Math.random(),
          twinkle: Math.random() * 0.01 + 0.005,
          speed: Math.random() * 0.03 + 0.01,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }
    };

    const drawNebula = () => {
      // Create a subtle nebula-like glow using multiple radial gradients
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, canvas.width * 0.8
      );
      
      gradient.addColorStop(0, 'rgba(30, 20, 50, 0.3)');
      gradient.addColorStop(0.5, 'rgba(10, 10, 20, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Faint blue glow in a corner
      const blueGrad = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.3, 0,
        canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.4
      );
      blueGrad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
      blueGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = blueGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      // Pause drawing if tab is hidden to save resources
      if (document.visibilityState === 'hidden') {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawNebula();

      // Draw and update stars
      stars.forEach(s => {
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity;
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        s.opacity += s.twinkle;
        if (s.opacity > 1 || s.opacity < 0.2) {
          s.twinkle = -s.twinkle;
        }

        s.y -= s.speed;
        if (s.y < 0) {
          s.y = canvas.height;
          s.x = Math.random() * canvas.width;
        }
      });

      // Occasional shooting stars - Adjusted frequency and size
      if (Math.random() < 0.005 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5,
          len: Math.random() * 150 + 50, // Increased length
          speed: Math.random() * 12 + 6,
          opacity: 1,
          width: Math.random() * 1.5 + 1.5 // Increased width
        });
      }

      shootingStars = shootingStars.filter(ss => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.len, ss.y + ss.len);
        grad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        grad.addColorStop(0.1, `rgba(200, 220, 255, ${ss.opacity * 0.8})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.width; // Thicker lines for better visibility
        ctx.lineCap = 'round';
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.len, ss.y + ss.len);
        ctx.stroke();

        ss.x += ss.speed;
        ss.y -= ss.speed;
        ss.opacity -= 0.015; // Slower fade for longer trails

        return ss.opacity > 0 && ss.x < canvas.width + ss.len && ss.y > -ss.len;
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[0]" aria-hidden="true" />;
};
