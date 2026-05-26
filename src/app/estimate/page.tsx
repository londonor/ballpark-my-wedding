"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEstimate } from "@/context/EstimateContext";
import { StepLayout } from "@/components/ui/StepLayout";
import { CategoryStep } from "@/components/steps/CategoryStep";
import { WEDDING_CATEGORIES } from "@/types";

export default function EstimatePage() {
  const router = useRouter();
  const { state, goNext, isLastCategoryStep } = useEstimate();

  useEffect(() => {
    if (!state.wedding) {
      router.replace("/");
    }
  }, [state.wedding, router]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [state.currentCategoryIndex]);

  if (!state.wedding) return null;

  const categoryKey = WEDDING_CATEGORIES[state.currentCategoryIndex]?.key;
  if (!categoryKey) return null;

  const handleCategoryNext = () => {
    if (isLastCategoryStep) {
      router.push("/result");
    } else {
      goNext();
    }
  };

  return (
    <StepLayout showStartOver>
      <CategoryStep
        key={state.currentCategoryIndex}
        wedding={state.wedding}
        category={categoryKey}
        onNext={handleCategoryNext}
      />
    </StepLayout>
  );
}
