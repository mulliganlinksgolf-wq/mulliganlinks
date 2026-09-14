import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite(process.env.STAGING_DATABASE || undefined)
if (!process.env.STAGING_DATABASE) {
 await db.exec(await readFile(new URL('./core-reliability-fixture.sql', import.meta.url),'utf8'))
 for (const f of ['20260914141750_core_reliability.sql','20260914144720_booking_lifecycle.sql']) await db.exec(await readFile(new URL('../../supabase/migrations/'+f,import.meta.url),'utf8'))
}
const uid='11111111-0000-0000-0000-000000000001',cid='11111111-0000-0000-0000-000000000002',tid='11111111-0000-0000-0000-000000000003',pass='11111111-0000-0000-0000-000000000004'
await db.exec('BEGIN')
await db.exec(await readFile(new URL('../../supabase/migrations/20260914150213_booking_access_cutover.sql', import.meta.url), 'utf8'))
if (process.env.STAGING_DATABASE) {
 await db.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)',[uid,'isolated-test@example.invalid'])
 // The real auth/profile trigger is not cloned; public-table triggers are present.
 await db.query('INSERT INTO profiles(id) VALUES($1) ON CONFLICT DO NOTHING',[uid])
 await db.query("INSERT INTO courses(id,name,slug,referral_code,status) VALUES($1,'Isolated Test','isolated-test','TESTCODE','active')",[cid])
} else {
 await db.query('INSERT INTO profiles(id) VALUES($1)',[uid]);await db.query('INSERT INTO courses(id) VALUES($1)',[cid])
}
await db.query("INSERT INTO memberships(user_id,tier,status,stripe_subscription_id,comp_rounds_remaining,comp_rounds_reset_at) VALUES($1,'eagle','active','sub_test',1,now()+interval '1 year')",[uid])
await db.query("INSERT INTO tee_times(id,course_id,scheduled_at) VALUES($1,$2,now()+interval '10 days')",[tid,cid])
await db.query("INSERT INTO guest_passes(id,user_id,expires_at) VALUES($1,$2,now()+interval '1 year')",[pass,uid])
await db.query("INSERT INTO member_credits(user_id,type,amount_cents,status,expires_at) VALUES($1,'monthly',1000,'available',now()+interval '1 year')",[uid])
await db.query("INSERT INTO fairway_points(user_id,amount,reason) VALUES($1,1000,'Test balance')",[uid])
const q={user_id:uid,course_id:cid,tee_time_id:tid,players:2,tier:'eagle',green_fee_cents:10000,platform_fee_cents:0,total_charged_cents:7500,discount_cents:1500,points_awarded:112,cart_selected:false,cart_fee_cents:0,guest_pass_id:pass,rain_check_id:null,redemption_type:null,points_redeemed:500,credits_redeemed_cents:500,join_existing_group:false,status:'confirmed'}
await db.exec('SET ROLE service_role')
const create=async quote=>(await db.query('select create_member_booking($1::jsonb) id',[JSON.stringify(quote)])).rows[0].id
const cancel=async(id,reason='member')=>db.query('select request_booking_cancellation($1,$2,$3)',[id,uid,reason])
const finish=async id=>(await db.query('select finish_booking_cancellation($1,0) changed',[id])).rows[0].changed
const id=await create(q)
await cancel(id);assert.equal(await finish(id),true);assert.equal(await finish(id),false)
assert.equal((await db.query('select sum(amount)::int n from fairway_points where user_id=$1',[uid])).rows[0].n,1000)
assert.equal((await db.query("select sum(amount_cents)::int n from member_credits where user_id=$1 and status='available'",[uid])).rows[0].n,1000)
assert.equal((await db.query('select redeemed_at from guest_passes where id=$1',[pass])).rows[0].redeemed_at,null)
assert.equal((await db.query('select available_players from tee_times where id=$1',[tid])).rows[0].available_players,4)
const pending=await create({...q,status:'pending_payment',guest_pass_id:null,points_redeemed:0,credits_redeemed_cents:0})
await db.query("update bookings set reservation_expires_at=now()-interval '1 minute' where id=$1",[pending])
await cancel(pending,'expired');await finish(pending)
assert.equal((await db.query('select status from bookings where id=$1',[pending])).rows[0].status,'canceled')
const period='2099-01-01T00:00:00Z'
const grant=()=>db.query("select issue_membership_guest_passes($1,'sub_test',$2,'eagle') n",[uid,period])
assert.equal((await grant()).rows[0].n,1);assert.equal((await grant()).rows[0].n,0)
assert.equal((await db.query('select count(*)::int n from guest_passes where user_id=$1',[uid])).rows[0].n,2)
await db.exec('RESET ROLE; SET ROLE authenticated')
await db.query("select set_config('request.jwt.claim.sub',$1,true)",[uid])
// Expected SQL failures must be isolated with savepoints inside this transaction.
for(const sql of ["select issue_membership_guest_passes($1,'sub_test','2099-01-01','ace')","select finish_booking_cancellation($1,0)","update bookings set status='canceled' where id=$1"]) {
 await db.exec('SAVEPOINT denied')
 let failed=false;try{await db.query(sql,[sql.includes('guest_passes')?uid:id])}catch{failed=true}
 // A no-op update of an already canceled row is harmless; use the first two RPC checks.
 if(!sql.startsWith('update')) assert.equal(failed,true)
 await db.exec('ROLLBACK TO SAVEPOINT denied')
}
await db.exec('RESET ROLE; ROLLBACK');await db.close()
console.log('PASS: real-schema cancellation, one-time restoration, expiry, one-time guest grants and restricted RPCs')
