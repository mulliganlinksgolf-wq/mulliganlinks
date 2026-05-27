-- Allow authenticated users to read any profile (needed for partner finder
-- to display other members' names, and similar member-facing features).
-- The existing "Users can view own profile" policy (auth.uid() = id) is
-- overly restrictive for a social feature; we keep it and add a broader one.
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);
