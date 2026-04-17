"use client";

import { useState, useEffect, useCallback } from "react";

// 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s
const PHASES = [
  { label: "Inspire", duration: 4, color: "text-blue-500" },
  { label: "Retiens", duration: 7, color: "text-amber-500" },
  { label: "Expire", duration: 8, color: "text-green-500" },
] as const;

const TOTAL_CYCLE = PHASES.reduce((sum, p) => sum + p.duration, 0);

export function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState<number>(PHASES[0].duration);
  const [scale, setScale] = useState(1);

  const reset = useCallback(() => {
    setRunning(false);
    setCycle(0);
    setPhaseIdx(0);
    setCountdown(PHASES[0].duration);
    setScale(1);
  }, []);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setPhaseIdx((pi) => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) {
              setCycle((c) => c + 1);
            }
            setScale(next === 0 ? 1.5 : next === 1 ? 1.5 : 1);
            return next;
          });
          // Return next phase duration (we read from the NEXT phase)
          return -1; // will be set properly below
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  // Fix countdown when phase changes
  useEffect(() => {
    if (running) {
      setCountdown(PHASES[phaseIdx].duration);
      // Set scale based on phase
      if (phaseIdx === 0) setScale(1.5); // grow on inhale
      else if (phaseIdx === 1) setScale(1.5); // hold at max
      else setScale(1); // shrink on exhale
    }
  }, [phaseIdx, running]);

  const phase = PHASES[phaseIdx];
  const progress = running
    ? ((PHASES[phaseIdx].duration - countdown) / PHASES[phaseIdx].duration) * 100
    : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium">Exercice de respiration</h2>
          <p className="text-xs text-zinc-500">
            Technique 4-7-8 pour calmer le stress
          </p>
        </div>
        {cycle > 0 && (
          <span className="text-xs text-zinc-400">
            {cycle} cycle{cycle > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Animated circle */}
        <div className="relative flex items-center justify-center h-40 w-40">
          {/* Background ring */}
          <div className="absolute inset-0 rounded-full border-2 border-zinc-100 dark:border-zinc-800" />
          {/* Progress ring */}
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progress * 2.89} 289`}
              className={`${phase.color} transition-all duration-1000 ease-linear`}
            />
          </svg>
          {/* Breathing circle */}
          <div
            className={`rounded-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/40 dark:to-green-900/40 flex items-center justify-center transition-transform ease-in-out`}
            style={{
              width: "100px",
              height: "100px",
              transform: `scale(${scale})`,
              transitionDuration: `${PHASES[phaseIdx].duration}s`,
            }}
          >
            {running ? (
              <div className="text-center">
                <div className={`text-2xl font-bold ${phase.color}`}>
                  {countdown}
                </div>
                <div className={`text-xs font-medium ${phase.color}`}>
                  {phase.label}
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 text-center px-2">
                Appuie pour commencer
              </div>
            )}
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex gap-4 text-xs">
          {PHASES.map((p, i) => (
            <div
              key={p.label}
              className={`flex items-center gap-1 ${
                running && i === phaseIdx
                  ? `font-bold ${p.color}`
                  : "text-zinc-400"
              }`}
            >
              <span>{p.label}</span>
              <span>{p.duration}s</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!running ? (
            <button
              onClick={() => setRunning(true)}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              Commencer
            </button>
          ) : (
            <>
              <button
                onClick={() => setRunning(false)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                Pause
              </button>
              <button
                onClick={reset}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                Arrêter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
