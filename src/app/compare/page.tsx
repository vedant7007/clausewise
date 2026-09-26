import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Compare documents",
  description: "Compare two versions of a document, or your document against a fair baseline.",
};

const CompareView = dynamic(
  () => import("@/components/compare/CompareView").then((mod) => mod.CompareView),
  {
    loading: () => (
      <p className="flex items-center gap-2">
        <Spinner className="text-accent" /> Loading compare view…
      </p>
    ),
  },
);

export default function ComparePage() {
  return <CompareView />;
}
