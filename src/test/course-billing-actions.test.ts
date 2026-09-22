// @vitest-environment node
import { beforeEach, it, expect, vi } from "vitest";
const m = vi.hoisted(() => ({
  requireManager: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  withLock: vi.fn(),
  checkout: vi.fn(),
  winter: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock("@/lib/courseRole", () => ({ requireManager: m.requireManager }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: m.from }),
}));
vi.mock("@/lib/course-billing/operations", () => ({
  withBillingLock: m.withLock,
  createCourseCheckout: m.checkout,
  scheduleWinter: m.winter,
  cancelWinter: m.cancel,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { updateCourseBilling } from "@/app/course/[slug]/billing/actions";
function form(action: string) {
  const f = new FormData();
  f.set("action", action);
  f.set("monthly", "349");
  f.set("reviewed", "yes");
  f.set("course_id", "other-course");
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("COURSE_BILLING_ENABLED", "true");
  m.requireManager.mockResolvedValue({
    courseId: "authorized-course",
    userId: "owner",
    isGlobalAdmin: false,
  });
  m.from.mockReturnValue({ insert: m.insert });
  m.insert.mockResolvedValue({ error: null });
  m.withLock.mockImplementation(async (_a, _c, run) =>
    run({ course_id: "authorized-course" }),
  );
});
it("requires manager authorization before any billing access", async () => {
  m.requireManager.mockRejectedValue(new Error("Unauthorized"));
  await expect(
    updateCourseBilling("course", {}, form("checkout")),
  ).rejects.toThrow("Unauthorized");
  expect(m.withLock).not.toHaveBeenCalled();
  expect(m.from).not.toHaveBeenCalled();
});
it("only global admins may confirm contracts", async () => {
  expect(
    await updateCourseBilling("course", {}, form("approve")),
  ).toHaveProperty("error");
  expect(m.insert).not.toHaveBeenCalled();
});
it("derives contract ownership from the verified course and preserves the selected free date", async () => {
  m.requireManager.mockResolvedValue({
    courseId: "authorized-course",
    userId: "admin",
    isGlobalAdmin: true,
  });
  const f = form("approve");
  f.set("freeUntil", "2027-09-01");
  expect(await updateCourseBilling("course", {}, f)).toHaveProperty("success");
  expect(m.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      course_id: "authorized-course",
      approved_by: "admin",
      free_until: "2027-09-01T12:00:00.000Z",
    }),
  );
});
it("requires review before winter or checkout calls and honors the activation gate", async () => {
  for (const action of ["winter", "checkout"]) {
    const f = form(action);
    f.delete("reviewed");
    expect(await updateCourseBilling("course", {}, f)).toHaveProperty("error");
  }
  expect(m.checkout).not.toHaveBeenCalled();
  expect(m.winter).not.toHaveBeenCalled();
  vi.stubEnv("COURSE_BILLING_ENABLED", "false");
  expect(
    await updateCourseBilling("course", {}, form("checkout")),
  ).toHaveProperty("error");
});
