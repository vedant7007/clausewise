// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { FirstRunNotice } from "@/components/layout/FirstRunNotice";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";

vi.mock("next/navigation", () => ({ usePathname: () => "/analyze" }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
});

describe("app shell", () => {
  it("offers a skip link to the main content", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main",
    );
  });

  it("always states that the service is not legal advice", () => {
    render(<DisclaimerBanner />);
    expect(screen.getByRole("complementary", { name: "Legal notice" })).toHaveTextContent(
      "Informational only, not legal advice.",
    );
  });

  it("marks the current page in the primary navigation", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analyse" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Ask" })).not.toHaveAttribute("aria-current");
  });

  it("links the disclaimer from the footer", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Disclaimer" })).toHaveAttribute("href", "/disclaimer");
  });
});

describe("FirstRunNotice", () => {
  beforeEach(() => localStorage.clear());

  it("shows on first visit and is remembered once acknowledged", () => {
    const { unmount } = render(<FirstRunNotice />);
    expect(screen.getByRole("dialog", { name: "Before you start" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I understand" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();
    render(<FirstRunNotice />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
