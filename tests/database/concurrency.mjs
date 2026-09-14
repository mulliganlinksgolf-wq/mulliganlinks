import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import pg from 'pg'

// Only a disposable, explicitly named local database may run this fixture.
const host = process.env.TEST_PGHOST || '/private/tmp/teeahead-local-postgres/socket'
if (!['localhost','127.0.0.1','/private/tmp/teeahead-local-postgres/socket'].includes(host)) throw new Error('Concurrency tests require local Postgres')
const config = { host, port: Number(process.env.TEST_PGPORT || 55439), database: 'teeahead_verification', user: process.env.TEST_PGUSER || process.env.USER, password: process.env.TEST_PGPASSWORD, statement_timeout: 10000 }
const clients = [new pg.Client(config),new pg.Client(config),new pg.Client(config)]
const [admin, first, second] = clients
try {
  await Promise.all(clients.map(c => c.connect()))
  const { rows } = await admin.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")
  assert.equal(rows[0].n,0,'Use an empty disposable teeahead_verification database')
  for (const file of ['core-reliability-fixture.sql','legacy-rpc-fixture.sql']) await admin.query(await readFile(new URL(file,import.meta.url),'utf8'))
  for (const file of ['20260914151313_core_reliability.sql','20260914151635_booking_lifecycle.sql','20260914151959_booking_access_cutover.sql','20260914170525_legacy_rpc_authorization.sql']) await admin.query(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'))
  const user='20000000-0000-0000-0000-000000000001',course='20000000-0000-0000-0000-000000000002'
  let time='20000000-0000-0000-0000-000000000003'
  await admin.query('INSERT INTO profiles(id) VALUES($1)',[user])
  await admin.query('INSERT INTO courses(id) VALUES($1)',[course])
  await admin.query('INSERT INTO course_admins(user_id,course_id) VALUES($1,$2)',[user,course])
  await admin.query("INSERT INTO memberships(user_id,tier,status) VALUES($1,'free','active')",[user])
  await admin.query("INSERT INTO tee_times(id,course_id,scheduled_at,max_players,available_players) VALUES($1,$2,now()+interval '1 day',1,1)",[time,course])
  for (const c of [first,second]) {
    await c.query('SET ROLE service_role')
    await c.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[user])
  }
  const quote={user_id:user,course_id:course,tee_time_id:time,players:1,tier:'free',green_fee_cents:1000,platform_fee_cents:0,total_charged_cents:1000,discount_cents:0,points_awarded:0,cart_selected:false,cart_fee_cents:0,points_redeemed:0,credits_redeemed_cents:0,join_existing_group:true,status:'pending_payment'}
  const member=c=>c.query('SELECT create_member_booking($1::jsonb)',[JSON.stringify(quote)])
  async function race(other) {
    await admin.query('BEGIN')
    await admin.query('SELECT id FROM courses WHERE id=$1 FOR UPDATE',[course])
    // Both requests must reach the database and wait on the same course lock.
    const result = Promise.allSettled([member(first),other(second)])
    let blocked=0
    const deadline=Date.now()+5000
    while(Date.now()<deadline) {
      blocked=(await admin.query("SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock'")).rows[0].n
      if(blocked===2) break
      await new Promise(resolve=>setTimeout(resolve,20))
    }
    await admin.query('COMMIT')
    const outcomes=await result
    assert.equal(blocked,2,'Both connections must actually overlap')
    assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1)
    const failure=outcomes.find(r=>r.status==='rejected')
    assert.match(failure.reason.message,/unavailable|capacity|Not enough available/)
    assert.equal((await admin.query('SELECT available_players FROM tee_times WHERE id=$1',[time])).rows[0].available_players,0)
    assert.equal((await admin.query('SELECT sum(players)::int n FROM bookings WHERE tee_time_id=$1',[time])).rows[0].n,1)
  }
  await race(member)
  time='20000000-0000-0000-0000-000000000004'
  quote.tee_time_id=time
  await admin.query("INSERT INTO tee_times(id,course_id,scheduled_at,max_players,available_players) VALUES($1,$2,now()+interval '1 day',1,1)",[time,course])
  await race(c=>c.query("SELECT create_walk_in_booking($1,'Local test','',1,10,'cash',NULL)",[time]))
  console.log('PASS: simultaneous member/member and member/walk-in reservations sell exactly one final spot without deadlock')
} finally {
  await admin.query('ROLLBACK').catch(()=>{})
  await Promise.allSettled(clients.map(c=>c.end()))
}
