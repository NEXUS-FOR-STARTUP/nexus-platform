-- Migration script to canonicalize legacy document categories in database
-- Table: document_records (metadata_json -> 'category')
-- Safely updates legacy categories:
--   'competitor_analysis' -> 'market_research'
--   'customer_research'   -> 'market_research'

BEGIN;

-- 1. Check count before update
SELECT 
  metadata_json->>'category' AS old_category, 
  COUNT(*) 
FROM document_records 
WHERE metadata_json->>'category' IN ('competitor_analysis', 'customer_research')
GROUP BY metadata_json->>'category';

-- 2. Canonicalize metadata_json in document_records (explicit ::jsonb cast for driver safety)
UPDATE document_records
SET metadata_json = jsonb_set(
  metadata_json::jsonb, 
  '{category}', 
  '"market_research"'
)
WHERE metadata_json->>'category' IN ('competitor_analysis', 'customer_research');

-- 3. Verify count after update
SELECT 
  metadata_json->>'category' AS current_category, 
  COUNT(*) 
FROM document_records 
WHERE metadata_json->>'category' IN ('market_research', 'competitor_analysis', 'customer_research')
GROUP BY metadata_json->>'category';

COMMIT;
