"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { SAMPLE_EXTRACTION } from "@/lib/sample-data";

export default function DemoPage() {
  const router = useRouter();
  const { addCarePlanFromExtraction, hydrated } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    addCarePlanFromExtraction(SAMPLE_EXTRACTION);
    router.replace("/");
  }, [hydrated, addCarePlanFromExtraction, router]);

  return (
    <main className="flex-1 flex items-center justify-center text-muted text-sm">
      Loading sample care plan…
    </main>
  );
}
