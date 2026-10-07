"use client";

import { cn } from "@/lib/cn";
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

type Speed = "slow" | "fast";

interface WavyBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[]
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: Speed;
  waveOpacity?: number;
  /** Vertical anchor of the wave centerline, 0 = top, 1 = bottom. Default 0.5. */
  waveYOffset?: number;
  /** Amplitude of the wave in px. Default 100. */
  amplitude?: number;
  /** Render a single frozen frame instead of animating (no rAF loop). */
  static?: boolean;
}

/**
 * Canvas-based animated wavy background using 3D simplex noise.
 * Drop-in wrapper: put hero content as children.
 *
 * Sizes to its container (ResizeObserver), NOT the viewport — so it can
 * live inside a section band instead of filling the whole screen.
 *
 * MOBILE OPTIMISATION: Canvas animation is disabled on touch/coarse-pointer
 * devices. A static CSS gradient is used instead. The canvas was running at
 * 60fps with blur filter and consuming 80-100% GPU budget on mobile.
 */
export const WavyBackground: React.FC<WavyBackgroundProps> = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  waveYOffset = 0.5,
  amplitude = 100,
  static: isStatic = false,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const noise = useRef(createNoise3D());
  const nt = useRef(0);

  const [isSafari, setIsSafari] = useState(false);
  // Detect touch/mobile — canvas animation disabled on these devices
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    setIsSafari(/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua));
    // Coarse pointer = touch device (phone / tablet)
    setIsTouch(
      typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches
    );
  }, []);

  useEffect(() => {
    // Skip canvas animation entirely on mobile — use static CSS instead.
    if (isTouch) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const waveColors = colors ?? [
      "#FF6A2F", // orange brand
      "#FF9066", // orange warm
      "#FFB180", // peach
      "#A7A099", // warm neutral
      "#FFEADB", // orange-light
    ];

    const getSpeed = () => (speed === "slow" ? 0.0008 : 0.0018);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      if (!isSafari) {
        ctx.filter = `blur(${blur}px)`;
      }
    };

    const drawWave = (n: number) => {
      nt.current += getSpeed();
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth || 50;
        ctx.strokeStyle = waveColors[i % waveColors.length];
        ctx.lineCap = "round";
        for (let x = 0; x < w; x += 5) {
          const y = noise.current(x / 800, 0.3 * i, nt.current) * amplitude;
          ctx.lineTo(x, y + h * waveYOffset);
        }
        ctx.stroke();
        ctx.closePath();
      }
    };

    const render = () => {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = backgroundFill ?? "rgba(250,248,244,0)";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, w, h);
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = waveOpacity;
      drawWave(5);
      ctx.restore();
      if (!isStatic) animRef.current = requestAnimationFrame(render);
    };

    resize();

    // Static mode: draw one frozen frame, redraw only on resize — no loop, no IO.
    if (isStatic) {
      const ro = new ResizeObserver(() => {
        resize();
        render();
      });
      ro.observe(container);
      render();
      return () => ro.disconnect();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Pause the animation loop when the section is not visible — saves
    // CPU/battery once the user has scrolled past the hero.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!animRef.current) render();
        } else {
          cancelAnimationFrame(animRef.current);
          animRef.current = 0;
        }
      },
      { threshold: 0.01 }
    );
    io.observe(container);

    return () => {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
      ro.disconnect();
      io.disconnect();
    };
  }, [
    isTouch,
    blur,
    speed,
    waveOpacity,
    waveWidth,
    backgroundFill,
    colors,
    isSafari,
    waveYOffset,
    amplitude,
    isStatic,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        containerClassName
      )}
    >
      {/* Canvas — desktop only. Hidden on mobile via CSS, skipped in JS too. */}
      {!isTouch && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0 pointer-events-none"
          style={isSafari ? { filter: `blur(${blur}px)` } : undefined}
        />
      )}

      {/* Static gradient fallback for mobile — zero GPU cost */}
      {isTouch && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(255,176,128,0.22) 0%, rgba(214,194,176,0.15) 45%, transparent 75%)",
          }}
        />
      )}

      <div className={cn("relative z-10 w-full", className)} {...rest}>
        {children}
      </div>
    </div>
  );
};
