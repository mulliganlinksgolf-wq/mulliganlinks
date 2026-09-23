import { afterEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import AppSidebar from "@/components/AppSidebar";
import AppBottomNav from "@/components/AppBottomNav";
import { SIDEBAR_NAV_ITEMS, BOTTOM_NAV_ITEMS } from "@/lib/nav";
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/bookings/example",
}));
afterEach(cleanup);
describe("member navigation", () => {
  it("highlights a nested booking route and preserves every destination", () => {
    render(<AppSidebar items={SIDEBAR_NAV_ITEMS} />);
    const nav = within(
      screen.getByRole("navigation", { name: "Member navigation" }),
    );
    for (const item of SIDEBAR_NAV_ITEMS)
      expect(nav.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    expect(nav.getByRole("link", { name: "Bookings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });
  it("closes the mobile menu on navigation and returns focus on Escape", () => {
    render(<AppSidebar items={SIDEBAR_NAV_ITEMS} />);
    fireEvent.click(screen.getByRole("button", { name: "Open member menu" }));
    expect(
      screen.getByRole("button", { name: "Close member menu" }),
    ).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("link", { name: "Billing" }));
    expect(
      screen.getByRole("button", { name: "Open member menu" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Open member menu" }));
    fireEvent.keyDown(screen.getByRole("link", { name: "My Card" }), {
      key: "Escape",
    });
    expect(
      screen.getByRole("button", { name: "Open member menu" }),
    ).toHaveFocus();
  });
  it("retains pending partner requests in the mobile shortcuts", () => {
    render(
      <AppBottomNav
        items={BOTTOM_NAV_ITEMS.map((item) =>
          item.href === "/app/partners" ? { ...item, badge: 12 } : item,
        )}
      />,
    );
    expect(screen.getByLabelText("12 pending requests")).toHaveTextContent(
      "9+",
    );
    expect(screen.getByRole("link", { name: /Partners/ })).toHaveAttribute(
      "href",
      "/app/partners",
    );
  });
});
