// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { BalanceMeter } from "@/components/analysis/BalanceMeter";
import { ClauseCard } from "@/components/analysis/ClauseCard";
import { GroundedBadge } from "@/components/analysis/GroundedBadge";
import { RiskCard } from "@/components/analysis/RiskCard";
import { StageProgress } from "@/components/analysis/StageProgress";
import { AnalysisNotices } from "@/components/analyze/AnalysisNotices";
import { AnalysisResults } from "@/components/analyze/AnalysisResults";
import { Tabs } from "@/components/ui/Tabs";
import { RENTAL_RESULT } from "../helpers/fixtures";
import { RENTAL_SESSION } from "./setup-dom";

describe("BalanceMeter", () => {
  it("exposes the score as a meter with a numeric value and a text verdict", () => {
    render(<BalanceMeter balance={{ score: 33, verdict: "Tilted against you" }} />);
    const meter = screen.getByRole("meter", { name: "Balance score" });
    expect(meter).toHaveAttribute("aria-valuenow", "33");
    expect(meter).toHaveAttribute("aria-valuetext", "33 out of 100: Tilted against you");
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getByText("Tilted against you")).toBeInTheDocument();
  });

  it("explains when there is nothing to score", () => {
    render(
      <BalanceMeter balance={{ score: null, verdict: "Not enough verified clauses to score" }} />,
    );
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(screen.getByText("Not enough verified clauses to score")).toBeInTheDocument();
  });
});

describe("ClauseCard", () => {
  const clause = RENTAL_RESULT.clauses[0]!;

  it("shows the tilt as text, not colour alone", () => {
    render(<ClauseCard clause={clause} />);
    expect(screen.getByRole("heading", { name: clause.title })).toBeInTheDocument();
    expect(screen.getByText(clause.tiltReason)).toBeInTheDocument();
  });

  it("discloses the verified source quote and its offset", () => {
    const { container } = render(<ClauseCard clause={clause} />);
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(screen.getByText("Show source"));
    expect(details.open).toBe(true);
    expect(within(details).getByText(clause.evidence.quote)).toBeInTheDocument();
    expect(details).toHaveTextContent(
      `characters ${clause.evidence.offset.toLocaleString("en-IN")}`,
    );
  });
});

describe("RiskCard", () => {
  it("conveys severity with a text label as well as colour", () => {
    const risk = { ...RENTAL_RESULT.risks[0]!, severity: "HIGH" as const };
    render(<RiskCard risk={risk} />);
    expect(screen.getByText("High risk")).toBeInTheDocument();
    expect(screen.getByText("What could go wrong")).toBeInTheDocument();
    expect(screen.getByText("What you can do")).toBeInTheDocument();
  });
});

describe("GroundedBadge", () => {
  it("reports verified and dropped claims", () => {
    render(<GroundedBadge grounding={{ verified: 22, total: 25 }} />);
    expect(screen.getByText("Grounded: 22/25 claims verified")).toBeInTheDocument();
    expect(screen.getByText(/3 claims were hidden/)).toBeInTheDocument();
  });
});

describe("AnalysisNotices", () => {
  it("labels a saved fixture clearly and reports redactions and ignored instructions", () => {
    render(
      <AnalysisNotices result={{ ...RENTAL_RESULT, source: "fixture", injectionsIgnored: 1 }} />,
    );
    expect(
      screen.getByText(/Showing a saved analysis of this sample document/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 suspicious instruction in the document was ignored/),
    ).toBeInTheDocument();
    expect(screen.getByText(/redacted before analysis/)).toBeInTheDocument();
  });
});

describe("StageProgress", () => {
  it("announces the current stage in a live region", () => {
    render(<StageProgress stage="verifying" />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking every quote");
    expect(screen.getAllByText(/\(done\)/)).toHaveLength(3);
  });
});

describe("Tabs", () => {
  const items = ["One", "Two", "Three"].map((label) => ({
    id: label,
    label,
    content: <p>{label} panel</p>,
  }));

  it("supports arrow, Home and End keys with roving focus", () => {
    render(<Tabs items={items} label="Sections" />);
    const [first, second, third] = screen.getAllByRole("tab");
    expect(first).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(first!, { key: "ArrowRight" });
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveFocus();
    fireEvent.keyDown(second!, { key: "End" });
    expect(third).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(third!, { key: "ArrowRight" });
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("One panel");
  });
});

describe("AnalysisResults", () => {
  it("renders the real fixture with no axe violations", async () => {
    const { container } = render(<AnalysisResults session={RENTAL_SESSION} onReset={() => {}} />);
    expect(
      screen.getByRole("heading", { level: 1, name: RENTAL_RESULT.brief.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole("meter")).toBeInTheDocument();
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("switches to the risk radar and deadlines tabs", () => {
    render(<AnalysisResults session={RENTAL_SESSION} onReset={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: /Risks/ }));
    expect(screen.getByRole("heading", { name: "Risk radar" })).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: /Deadlines/ }));
    expect(screen.getByRole("button", { name: /Download checklist/ })).toBeVisible();
  });
});
