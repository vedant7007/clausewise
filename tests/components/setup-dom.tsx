import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { type Session, SessionProvider } from "@/components/session/SessionProvider";
import { RENTAL_RESULT } from "../helpers/fixtures";

/** A session holding the real rental fixture. */
export const RENTAL_SESSION: Session = {
  document: { name: "Sample rental agreement.txt", text: "Rental text", sampleId: "rental" },
  result: RENTAL_RESULT,
};

/**
 * Renders a component inside a session provider.
 * @param ui - element to render.
 * @param session - initial session, or null for the empty state.
 */
export function renderWithSession(ui: ReactElement, session: Session | null = RENTAL_SESSION) {
  return render(<SessionProvider initialSession={session}>{ui}</SessionProvider>);
}
