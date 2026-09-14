-- Additional legacy objects needed to exercise the authorization migration locally.
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
ALTER TABLE profiles ADD COLUMN teeahead_credit_cents integer DEFAULT 0;
ALTER TABLE course_admins ADD COLUMN role text DEFAULT 'owner';
ALTER TABLE bookings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE bookings ADD COLUMN guest_name text, ADD COLUMN guest_phone text, ADD COLUMN guest_email text, ADD COLUMN payment_method text;
CREATE TYPE course_permission AS ENUM ('manage_bookings');
CREATE TABLE crm_course_users(user_id uuid,course_id uuid,role text);
CREATE TABLE staff_permissions(user_id uuid,course_id uuid,permission course_permission,granted boolean);
CREATE TABLE role_default_permissions(role text,permission course_permission);
CREATE TABLE tee_time_listings(id uuid PRIMARY KEY,status text,expires_at timestamptz,listed_by_member_id uuid,claimed_by_member_id uuid,claimed_at timestamptz,updated_at timestamptz,credit_amount_cents integer,course_id uuid);
CREATE TABLE tee_time_transfers(listing_id uuid,from_member_id uuid,to_member_id uuid,course_id uuid,credit_issued_cents integer);
INSERT INTO role_default_permissions VALUES('owner','manage_bookings');
