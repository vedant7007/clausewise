import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { FirstRunNotice } from "@/components/layout/FirstRunNotice";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { SessionProvider } from "@/components/session/SessionProvider";
import "./globals.css";

const body = Public_Sans({ variable: "--font-body", subsets: ["latin"] });
const heading = Source_Serif_4({ variable: "--font-heading", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ClauseWise: know what you're signing", template: "%s | ClauseWise" },
  description:
    "Understand rental agreements, job offers, NDAs and loan papers in plain English. See which clauses tilt against you, with every claim backed by a verified quote.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SkipLink />
        <DisclaimerBanner />
        <Header />
        <SessionProvider>
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12"
          >
            {children}
          </main>
        </SessionProvider>
        <Footer />
        <FirstRunNotice />
      </body>
    </html>
  );
}
