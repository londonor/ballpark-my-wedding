"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(((current + 1) / total) * 100, 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-sand-600">{label}</span>
          <span className="text-sm text-sand-400">
            {current + 1} of {total}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-sand-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-sage-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
