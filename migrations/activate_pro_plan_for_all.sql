-- Migration: Activate Pro Plan for all users (for testing purposes)
-- Sets pro_plan = true for all existing users

UPDATE users
SET pro_plan = true
WHERE pro_plan = false OR pro_plan IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE pro_plan = true) as pro_plan_users,
  COUNT(*) FILTER (WHERE pro_plan = false) as free_plan_users
FROM users;
