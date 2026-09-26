import type { Metadata } from "next";
import { AskView } from "@/components/ask/AskView";

export const metadata: Metadata = {
  title: "Ask about your document",
  description: "Grounded answers drawn only from your document, with verified quotes.",
};

export default function AskPage() {
  return <AskView />;
}
