-- Track which parties have booked a tee time after a connection is accepted
ALTER TABLE partner_connection_requests
  ADD COLUMN IF NOT EXISTS requester_booked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recipient_booked boolean NOT NULL DEFAULT false;
