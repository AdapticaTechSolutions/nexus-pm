/**
 * Fix Team Members RLS Infinite Recursion
 * 
 * The issue: The team_members policy was querying team_members table
 * while evaluating the policy itself, causing infinite recursion.
 * 
 * Solution: Create a SECURITY DEFINER helper function that bypasses RLS
 * to check team membership, then use that in the policies.
 */

-- Create a helper function that bypasses RLS to check if user is in a team
CREATE OR REPLACE FUNCTION is_user_in_team(team_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM team_members tm
        JOIN profiles p ON p.id = tm.profile_id
        WHERE tm.team_id = team_uuid 
        AND p.user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can read their team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can read their teams" ON teams;

-- Recreate team_members policy using the helper function (which bypasses RLS)
CREATE POLICY "Users can read their team memberships"
    ON team_members FOR SELECT
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = team_members.profile_id AND p.user_id = auth.uid()
        )
        OR is_user_in_team(team_members.team_id)
    );

-- Recreate teams policy using the helper function
CREATE POLICY "Team members can read their teams"
    ON teams FOR SELECT
    USING (
        is_admin()
        OR is_user_in_team(teams.id)
    );
