"use client";

import { type ReactNode } from "react";
import { ProgressBar } from "./ProgressBar";
import { Button } from "./Button";
import { useEstimate } from "@/context/EstimateContext";

interface StepLayoutProps {
  children: ReactNode;
  showProgress?: boolean;
  showBack?: boolean;
  showStartOver?: boolean;
}

export function StepLayout({
  children,
  showProgress = true,
  showBack = true,
  showStartOver = false,
}: StepLayoutProps) {
  const { state, totalSteps, stepLabel, goBack, canGoBack, reset } = useEstimate();

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      <header className="border-b border-sand-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <a href="/">
              <img src="/logo.png" alt="Ballpark my wedding" className="h-24 w-auto" />
            </a>
            {showStartOver && (
              <button
                onClick={() => {
                  reset();
                  window.location.href = "/";
                }}
                className="text-sm text-sand-500 hover:text-sand-700 transition-colors cursor-pointer"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {showProgress && (
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 sm:px-6">
          <ProgressBar
            current={state.currentCategoryIndex}
            total={totalSteps}
            label={stepLabel}
          />
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {children}
      </main>

      {showBack && canGoBack && (
        <div className="border-t border-sand-200 bg-white/80 backdrop-blur-sm sticky bottom-0">
          <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
            <Button variant="ghost" size="sm" onClick={goBack}>
              &larr; Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
