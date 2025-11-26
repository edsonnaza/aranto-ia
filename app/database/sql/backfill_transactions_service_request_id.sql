-- Backfill service_request_id on transactions by matching concept to service_requests.request_number
-- WARNING: run a backup or test before applying on production

UPDATE transactions t
JOIN service_requests s ON t.concept LIKE CONCAT('%', s.request_number, '%')
SET t.service_request_id = s.id
WHERE (t.service_request_id IS NULL OR t.service_request_id = '')
  AND t.concept IS NOT NULL
  AND s.request_number IS NOT NULL;

-- To check how many rows would be affected before running, you can run:
-- SELECT COUNT(*) FROM transactions t JOIN service_requests s ON t.concept LIKE CONCAT('%', s.request_number, '%') WHERE (t.service_request_id IS NULL OR t.service_request_id = '') AND t.concept IS NOT NULL;
