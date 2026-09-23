import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CourseSidebar } from "@/components/course/CourseSidebar";
const state = vi.hoisted(() => ({ path: "/course/demo/reports/rounds" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
afterEach(cleanup);
const props = {
  slug: "demo",
  courseName: "Sample Golf Club",
  role: "owner",
  isManager: true,
  userInitials: "AB",
  userName: "Alex Brown",
};
describe("course navigation", () => {
  it("marks the parent of a nested route as the current page", () => {
    render(<CourseSidebar {...props} />);
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Tee sheet" })).not.toHaveAttribute(
      "aria-current",
    );
  });
  it("keeps management links out of the staff navigation", () => {
    render(<CourseSidebar {...props} isManager={false} role="staff" />);
    for (const name of [
      "Payments",
      "Reports",
      "Marketing",
      "Billing",
      "Settings",
    ])
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Check-in" })).toHaveAttribute(
      "href",
      "/course/demo/check-in",
    );
    expect(
      screen.getByRole("link", { name: "Knowledge base" }),
    ).toBeInTheDocument();
  });
  it("opens the mobile menu, closes it on selection, and restores focus on Escape", () => {
    render(<CourseSidebar {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Open course menu" }));
    expect(
      screen.getByRole("button", { name: "Close course menu" }),
    ).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("link", { name: "Reports" }));
    expect(
      screen.getByRole("button", { name: "Open course menu" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Open course menu" }));
    fireEvent.keyDown(screen.getByRole("link", { name: "Reports" }), {
      key: "Escape",
    });
    expect(
      screen.getByRole("button", { name: "Open course menu" }),
    ).toHaveFocus();
  });
});
