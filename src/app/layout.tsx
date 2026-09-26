import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const body = Public_Sans({ variable: "--font-body", subsets: ["latin"] });
const heading = Source_Serif_4({ variable: "--font-heading", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ClauseWise: know what you're signing", template: "%s | ClauseWise" },
  description:
    "Understand rental agreements, job offers, NDAs and loan papers in plain English. See which clauses tilt against you, with every claim backed by a verified quote.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
