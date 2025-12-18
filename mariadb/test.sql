-- Databases size
SELECT table_schema "DB Name", ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) "DB Size in MB"
FROM information_schema.tables GROUP BY table_schema;

-- Top 10 tables size
SELECT table_schema as `Database`, table_name AS `Table`, ROUND(((data_length + index_length) / 1024 / 1024), 2) `Size in MB`
FROM information_schema.TABLES
ORDER BY (data_length + index_length)
DESC LIMIT 10;

-- Buffer pool reads efficiency
SELECT (1 - (Variable_value / (SELECT Variable_value 
FROM information_schema.global_status 
WHERE Variable_name = 'Innodb_buffer_pool_read_requests')   )) * 100 AS buffer_pool_hit_rate 
FROM information_schema.global_status  
WHERE Variable_name = 'Innodb_buffer_pool_reads';

-- Top queries by execution count
SELECT DIGEST_TEXT, COUNT_STAR, AVG_TIMER_WAIT/1000000000000 as avg_time_sec
FROM performance_schema.events_statements_summary_by_digest 
WHERE SCHEMA_NAME IS NOT NULL
ORDER BY COUNT_STAR DESC 
LIMIT 5;

-- Top queries by total execution time
SELECT DIGEST_TEXT, SUM_TIMER_WAIT/1000000000000 as total_time_sec, COUNT_STAR
FROM performance_schema.events_statements_summary_by_digest 
WHERE SCHEMA_NAME IS NOT NULL
ORDER BY SUM_TIMER_WAIT DESC 
LIMIT 5;
