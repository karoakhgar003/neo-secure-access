-- Helper query to check current credential-plan assignments
-- Run this first to see what you have:
SELECT 
  pc.id,
  pc.username,
  p.name as product_name,
  pp.name as plan_name,
  pc.plan_id,
  CASE 
    WHEN pc.plan_id IS NULL THEN 'No specific plan (will match any order)'
    ELSE 'Assigned to specific plan'
  END as assignment_status
FROM product_credentials pc
JOIN products p ON p.id = pc.product_id
LEFT JOIN product_plans pp ON pp.id = pc.plan_id
ORDER BY p.name, pp.name;

-- If you need to update a credential to a specific plan, use this:
-- First, find the plan_id you want:
-- SELECT id, name FROM product_plans WHERE product_id = 'YOUR_PRODUCT_ID';

-- Then update the credential:
-- UPDATE product_credentials 
-- SET plan_id = 'PLAN_ID_HERE'
-- WHERE id = 'CREDENTIAL_ID_HERE';

-- Example: If you have a GPT credential that should only work for 7-users plan:
-- UPDATE product_credentials 
-- SET plan_id = (SELECT id FROM product_plans WHERE name = '7-users' AND product_id = pc.product_id)
-- FROM product_credentials pc
-- WHERE product_credentials.id = pc.id 
-- AND product_credentials.username = 'YOUR_USERNAME_HERE';
