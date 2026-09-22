import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create table courses(id uuid primary key); create table profiles(id uuid primary key);
create table tee_times(id uuid primary key,course_id uuid,scheduled_at timestamptz);
create table bookings(id uuid primary key default gen_random_uuid(),tee_time_id uuid);
grant select on tee_times to anon,authenticated,service_role;
grant insert,select on bookings to authenticated,service_role;`);
await db.exec(
  await readFile(
    new URL(
      "../../supabase/migrations/20260922231422_course_seasonal_billing.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const cid = "00000000-0000-4000-8000-000000000001",
  slot = "00000000-0000-4000-8000-000000000002";
await db.query("insert into courses values($1);", [cid]);
await db.query(
  "insert into tee_times values($1,$2,now()+interval '2 months')",
  [slot, cid],
);
await db.exec("set role authenticated");
await db.query("insert into bookings(tee_time_id) values($1)", [slot]);
await assert.rejects(
  db.query("select * from course_billing_accounts"),
  /permission denied/,
);
await assert.rejects(
  db.query("select claim_course_billing($1)", [cid]),
  /permission denied/,
);
await assert.rejects(
  db.query("insert into course_booking_access(course_id) values($1)", [cid]),
  /permission denied/,
);
await db.exec("reset role");
await db.query("insert into course_billing_accounts(course_id) values($1)", [
  cid,
]);
await db.query(
  "insert into course_booking_access values($1,now()-interval '1 day',now()+interval '1 month',false)",
  [cid],
);
await db.exec("set role authenticated");
await assert.rejects(
  db.query("insert into bookings(tee_time_id) values($1)", [slot]),
  /Winter Plan/,
);
// Existing bookings remain available.
assert.equal(
  (await db.query("select count(*)::int as n from bookings")).rows[0].n,
  1,
);
await db.exec("reset role");
await db.query(
  "update course_booking_access set winter_start_at=now()+interval '1 month',winter_end_at=now()+interval '3 months'",
);
await assert.rejects(
  db.query("insert into bookings(tee_time_id) values($1)", [slot]),
  /Winter Plan/,
);
await db.query(
  "update course_booking_access set winter_start_at=now()-interval '2 months',winter_end_at=now()-interval '1 second'",
);
await db.query("insert into bookings(tee_time_id) values($1)", [slot]);
await db.query("update course_booking_access set billing_blocked=true");
await assert.rejects(
  db.query("insert into bookings(tee_time_id) values($1)", [slot]),
  /not accepting/,
);
await db.exec("set role service_role");
assert.ok(
  (await db.query("select claim_course_billing($1) as token", [cid])).rows[0]
    .token,
);
assert.equal(
  (await db.query("select claim_course_billing($1) as token", [cid])).rows[0]
    .token,
  null,
);
await db.close();
console.log(
  "Course billing database verification passed: RLS, leases, existing reservations, and seasonal booking boundaries.",
);
