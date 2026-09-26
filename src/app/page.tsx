import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { NotAdvice } from "@/components/landing/NotAdvice";
import { ProofStrip } from "@/components/landing/ProofStrip";
import { SampleCards } from "@/components/landing/SampleCards";
import { Showcase } from "@/components/landing/Showcase";

export default function HomePage() {
  return (
    <div className="space-y-20 sm:space-y-28">
      <Hero />
      <ProofStrip />
      <HowItWorks />
      <SampleCards />
      <Showcase />
      <NotAdvice />
    </div>
  );
}
