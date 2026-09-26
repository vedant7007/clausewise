// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NegotiationPanel } from "@/components/analysis/NegotiationPanel";
import { TimelineList } from "@/components/analysis/TimelineList";
import { DocumentPicker } from "@/components/analyze/DocumentPicker";
import { AskView } from "@/components/ask/AskView";
import { CompareView } from "@/components/compare/CompareView";
import { PrepView } from "@/components/prep/PrepView";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { RENTAL_RESULT } from "../helpers/fixtures";
import { renderWithSession } from "./setup-dom";

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AskView", () => {
  it("asks for a document when none is loaded", () => {
    renderWithSession(<AskView />, null);
    expect(
      screen.getByRole("heading", { level: 1, name: "Analyse a document first" }),
    ).toBeInTheDocument();
  });

  it("sends the question with the document and shows the grounded answer", async () => {
    const fetchMock = stubFetch({
      status: "ANSWERED",
      answer: "Two months' written notice.",
      evidence: [{ quote: "two (2) months' written notice", offset: 100, length: 30 }],
      confidence: "HIGH",
      grounding: { verified: 1, total: 1 },
      injectionsIgnored: 0,
    });
    renderWithSession(<AskView />);
    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "How much notice?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText("Two months' written notice.")).toBeInTheDocument();
    expect(screen.getByText("Answered from your document")).toBeInTheDocument();
    const body = JSON.parse(
      String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body),
    ) as {
      question: string;
      documentText: string;
    };
    expect(body).toMatchObject({ question: "How much notice?", documentText: "Rental text" });
  });

  it("shows a retryable error when the service fails", async () => {
    stubFetch({ error: { code: "AI_UNAVAILABLE", message: "Temporarily unavailable." } }, 503);
    renderWithSession(<AskView />);
    fireEvent.click(screen.getByRole("button", { name: EXAMPLE_QUESTION }));
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Temporarily unavailable.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });
});

const EXAMPLE_QUESTION = "How much notice do I need to give to leave?";

describe("PrepView", () => {
  it("renders every prep section from the analysis", () => {
    renderWithSession(<PrepView />);
    for (const name of [
      "Case summary",
      "Questions to ask your lawyer",
      "Key risks",
      "Documents to bring",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Print or save as PDF/ })).toBeInTheDocument();
  });
});

describe("CompareView", () => {
  it("compares the session document against the fair baseline for its type", async () => {
    const fetchMock = stubFetch({
      leftName: "Sample rental agreement.txt",
      rightName: "Fair baseline: Rental agreement",
      summary: "Your deposit is three times the baseline.",
      differences: [
        {
          id: "difference-1",
          topic: "Security deposit",
          change: "MODIFIED",
          importance: "HIGH",
          whatChanged: "Six months versus two.",
          whatItMeansForYou: "More money locked up.",
          leftEvidence: { quote: "six months' licence fee", offset: 1, length: 23 },
          rightEvidence: null,
        },
      ],
      grounding: { verified: 1, total: 1 },
      redactionCount: 2,
      injectionsIgnored: 0,
    });
    renderWithSession(<CompareView />);
    expect(screen.getByLabelText("Baseline")).toHaveValue("rental");
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(
      await screen.findByText("Your deposit is three times the baseline."),
    ).toBeInTheDocument();
    expect(screen.getByText("High importance")).toBeInTheDocument();
    const body = JSON.parse(
      String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body),
    ) as {
      right: unknown;
    };
    expect(body.right).toEqual({ mode: "baseline", baseline: "rental" });
  });
});

describe("NegotiationPanel", () => {
  it("drafts rewrites for adverse clauses and offers copy buttons", async () => {
    const adverse = RENTAL_RESULT.clauses.filter((clause) => clause.tilt.includes("COUNTERPARTY"));
    const fetchMock = stubFetch({
      items: adverse.map((clause) => ({
        clauseId: clause.id,
        rewrite: `Fair ${clause.id}`,
        message: "Hello",
      })),
    });
    render(
      <NegotiationPanel
        clauses={RENTAL_RESULT.clauses}
        options={{ language: "en", plainLanguage: false }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Draft my negotiation kit" }));
    expect(await screen.findByText(`Fair ${adverse[0]!.id}`)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Copy message" })).toHaveLength(adverse.length);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/negotiate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("copies to the clipboard and confirms", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const clause = RENTAL_RESULT.clauses.find((item) => item.tilt.includes("COUNTERPARTY"))!;
    stubFetch({
      items: [{ clauseId: clause.id, rewrite: "Fair", message: "Please change this." }],
    });
    render(
      <NegotiationPanel clauses={[clause]} options={{ language: "en", plainLanguage: false }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Draft my negotiation kit" }));
    fireEvent.click(await screen.findByRole("button", { name: "Copy message" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Please change this."));
    expect(await screen.findByText("Copied to clipboard")).toBeInTheDocument();
  });
});

describe("TimelineList", () => {
  it("downloads the checklist as Markdown", () => {
    const createObjectURL = vi.fn(() => "blob:checklist");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<TimelineList obligations={RENTAL_RESULT.obligations} title="Lease" />);
    fireEvent.click(screen.getByRole("button", { name: /Download checklist/ }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });
});

describe("Document selection", () => {
  it("passes a chosen file to the handler", () => {
    const onFile = vi.fn();
    render(<FileDropzone onFile={onFile} />);
    const file = new File(["text"], "lease.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText(/Choose a document/), { target: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("starts a sample analysis from the picker", () => {
    const onSubmit = vi.fn();
    render(<DocumentPicker onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /Non-disclosure agreement/ }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: "sample", sampleId: "nda" });
  });
});
