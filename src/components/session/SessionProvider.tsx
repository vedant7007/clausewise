"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import type { SessionDocument } from "@/lib/schemas/analyze-stream";

/** The current document and its analysis, held only in this browser tab's memory. */
export interface Session {
  document: SessionDocument;
  result: AnalysisResult;
}

interface SessionContextValue {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Keeps the analysed document in React state so Q&A, compare and prep pages can reuse it.
 * Nothing is written to storage; closing or reloading the tab clears it.
 * @param initialSession - optional starting session, used when rendering views in isolation.
 */
export function SessionProvider({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  initialSession?: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const value = useMemo(() => ({ session, setSession }), [session]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Reads the in-memory session.
 * @throws when used outside SessionProvider (a wiring bug).
 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
