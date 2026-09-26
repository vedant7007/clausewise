import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Lawyer prep pack",
  description: "Questions, gaps and a one-page summary to take to a lawyer.",
};

const PrepView = dynamic(() => import("@/components/prep/PrepView").then((mod) => mod.PrepView), {
  loading: () => (
    <p className="flex items-center gap-2">
      <Spinner className="text-accent" /> Loading prep pack…
    </p>
  ),
});

export default function PrepPage() {
  return <PrepView />;
}
