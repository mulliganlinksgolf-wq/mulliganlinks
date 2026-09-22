import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
const db = new PGlite()
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create table courses(id uuid primary key, name text, status text, address text, city text, state text, zip text);
create table profiles(id uuid primary key);
create table memberships(user_id uuid, tier text, status text);
grant select,update on courses to service_role; grant select on memberships to service_role;`)
await db.exec(
  await readFile(
    new URL(
      '../../supabase/migrations/20260922224035_course_marketing.sql',
      import.meta.url,
    ),
    'utf8',
  ),
)
const c1 = '00000000-0000-4000-8000-000000000001',
  c2 = '00000000-0000-4000-8000-000000000002'
const uid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
await db.query(
  "insert into courses values ($1,'Course A','active','123 Main','Detroit','MI','48201'),($2,'Course B','active','456 Main','Detroit','MI','48201')",
  [c1, c2],
)
for (let i = 1; i <= 5; i++)
  await db.query('insert into profiles values($1)', [uid(i)])
await db.query(
  "insert into memberships values($1,'ace','active'),($2,'eagle','active'),($3,'ace','cancelled'),($3,'free','active')",
  [uid(1), uid(2), uid(3)],
)
for (const [i, c, sub] of [
  [1, c1, true],
  [2, c1, true],
  [3, c1, true],
  [4, c1, false],
  [5, c2, true],
])
  await db.query(
    'insert into course_email_subscriptions(course_id,user_id,email,subscribed) values($1,$2,$3,$4)',
    [c, uid(i), `golfer${i}@example.com`, sub],
  )
await db.exec('set role service_role')
const queue = async (id, audience = 'all', course = c1) =>
  db.query(
    "select queue_course_email($1,$2,$3,'Hello','A round this week?', $4)",
    [uid(id), course, uid(1), audience],
  )
await queue(10)
assert.equal(
  (await db.query('select * from course_email_deliveries')).rows.length,
  3,
  'only opted-in golfers from the selected course',
)
await queue(10)
assert.equal(
  (await db.query('select * from course_email_deliveries')).rows.length,
  3,
  'double submit does not resend',
)
await queue(11, 'eagle_ace')
assert.equal(
  (
    await db.query(
      'select * from course_email_deliveries where campaign_id=$1',
      [uid(11)],
    )
  ).rows.length,
  2,
)
await queue(12, 'fairway')
assert.equal(
  (
    await db.query(
      'select email from course_email_deliveries where campaign_id=$1',
      [uid(12)],
    )
  ).rows[0].email,
  'golfer3@example.com',
  'inactive paid membership becomes Fairway',
)
await db.query(
  'update course_email_subscriptions set subscribed=false where user_id=$1',
  [uid(1)],
)
await assert.rejects(queue(13, 'ace'), /No subscribed golfers/)
assert.equal(
  (
    await db.query('select * from course_email_campaigns where id=$1', [
      uid(13),
    ])
  ).rows.length,
  0,
  'empty audience rolls back campaign',
)
await assert.rejects(queue(13, 'invalid'), /check constraint/)
await db.exec("update courses set address=null where name='Course B'")
await assert.rejects(queue(13, 'all', c2), /mailing address/)
assert.equal(
  (await db.query('select claim_course_email_worker() as claimed')).rows[0]
    .claimed,
  true,
)
assert.equal(
  (await db.query('select claim_course_email_worker() as claimed')).rows[0]
    .claimed,
  false,
  'overlapping worker is rejected',
)
await queue(14)
await queue(15)
await assert.rejects(queue(16), /five campaigns/)
const history = (await db.query('select * from course_email_history($1)', [c1]))
  .rows
assert.equal(history.length, 5)
assert.equal(
  (await db.query('select * from course_email_history($1)', [c2])).rows.length,
  0,
)
for (const role of ['anon', 'authenticated']) {
  await db.exec(`reset role; set role ${role}`)
  for (const table of [
    'course_email_subscriptions',
    'course_email_campaigns',
    'course_email_deliveries',
    'course_email_worker',
    'course_email_audience',
  ])
    await assert.rejects(
      db.query(`select * from ${table}`),
      /permission denied/,
    )
  await assert.rejects(queue(20), /permission denied/)
  await assert.rejects(
    db.query('select claim_course_email_worker()'),
    /permission denied/,
  )
}
await db.close()
console.log(
  'PASS: course isolation, opt-in, tier filtering, idempotent queue, rollback, address requirement, worker lock, daily limit, history, client access denied',
)
