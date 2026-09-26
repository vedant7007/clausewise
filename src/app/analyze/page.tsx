import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyzeWorkspace } from "@/components/analyze/AnalyzeWorkspace";

export const metadata: Metadata = {
  title: "Analyse a document",
  description: "Upload a legal document for a plain-English brief, clause ledger and risk review.",
};

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeWorkspace />
    </Suspense>
  );
}
