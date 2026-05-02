"use client";
import { useEffect, useState } from "react";

interface Props {
  score: number;
}

export default function ScoreRing({ score }: Props) {
  const [animated, setAnimated] = useState(false);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "var(--ok)" : score >= 60 ? "var(--warn)" : "var(--error)";
  const label =
    score >= 90 ? "優秀" : score >= 80 ? "良好" : score >= 60 ? "普通" : "要改善";

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold leading-none"
            style={{ fontSize: "2.2rem", color }}
          >
            {score}
          </span>
          <span className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
            / 100
          </span>
        </div>
      </div>
      <span
        className="text-sm font-medium px-3 py-1 rounded-full"
        style={{ background: color + "18", color }}
      >
        {label}
      </span>
    </div>
  );
}
