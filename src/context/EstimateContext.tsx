"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  WeddingState,
  WeddingSelection,
  WeddingCategory,
  TierOption,
} from "@/types";
import { WEDDING_CATEGORIES } from "@/types";

const TOTAL_CATEGORIES = WEDDING_CATEGORIES.length; // 9

interface EstimateContextType {
  state: WeddingState;
  totalSteps: number;
  stepLabel: string;
  currentCategory: WeddingCategory | null;
  goNext: () => void;
  goBack: () => void;
  canGoBack: boolean;
  isLastCategoryStep: boolean;
  setWedding: (w: WeddingSelection) => void;
  setTierForCategory: (category: WeddingCategory, tier: TierOption) => void;
  setExampleForCategory: (category: WeddingCategory, price: number) => void;
  reset: () => void;
}

const initialState: WeddingState = {
  wedding: null,
  currentCategoryIndex: 0,
};

const EstimateContext = createContext<EstimateContextType | null>(null);

export function EstimateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WeddingState>(initialState);

  const currentCategory =
    WEDDING_CATEGORIES[state.currentCategoryIndex]?.key ?? null;

  const stepLabel = (() => {
    const cat = WEDDING_CATEGORIES[state.currentCategoryIndex];
    return cat ? cat.label : "Complete";
  })();

  const isLastCategoryStep = state.currentCategoryIndex === TOTAL_CATEGORIES - 1;

  const goNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentCategoryIndex: Math.min(
        prev.currentCategoryIndex + 1,
        TOTAL_CATEGORIES - 1,
      ),
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentCategoryIndex: Math.max(prev.currentCategoryIndex - 1, 0),
    }));
  }, []);

  const setWedding = useCallback((w: WeddingSelection) => {
    setState((prev) => ({ ...prev, wedding: w, currentCategoryIndex: 0 }));
  }, []);

  const setTierForCategory = useCallback(
    (category: WeddingCategory, tier: TierOption) => {
      setState((prev) => {
        if (!prev.wedding) return prev;
        const newTierExamples = { ...(prev.wedding.tierExamples ?? {}) };
        delete newTierExamples[category];
        return {
          ...prev,
          wedding: {
            ...prev.wedding,
            tiers: { ...prev.wedding.tiers, [category]: tier },
            tierExamples: newTierExamples,
          },
        };
      });
    },
    [],
  );

  const setExampleForCategory = useCallback(
    (category: WeddingCategory, price: number) => {
      setState((prev) => {
        if (!prev.wedding) return prev;
        return {
          ...prev,
          wedding: {
            ...prev.wedding,
            tierExamples: { ...(prev.wedding.tierExamples ?? {}), [category]: price },
          },
        };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <EstimateContext.Provider
      value={{
        state,
        totalSteps: TOTAL_CATEGORIES,
        stepLabel,
        currentCategory,
        goNext,
        goBack,
        canGoBack: state.currentCategoryIndex > 0,
        isLastCategoryStep,
        setWedding,
        setTierForCategory,
        setExampleForCategory,
        reset,
      }}
    >
      {children}
    </EstimateContext.Provider>
  );
}

export function useEstimate() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error("useEstimate must be used within EstimateProvider");
  return ctx;
}
