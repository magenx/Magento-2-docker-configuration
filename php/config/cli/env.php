<?php
return [
    'backend' => [
        'frontName' => getenv('ADMIN_PATH')
    ],
    'remote_storage' => [
        'driver' => 'file'
    ],
    'queue' => [
        'amqp' => [
            'host' => 'rabbitmq',
            'port' => '5672',
            'user' => getenv('BRAND'),
            'password' => getenv('RABBITMQ_PASSWORD'),
            'virtualhost' => '/'.getenv('BRAND')
        ],
        'consumers_wait_for_messages' => 0
    ],
    'indexer' => [
        'batch_size' => [
            'cataloginventory_stock' => [
                'simple' => 650
            ],
            'catalog_category_product' => 1000,
            'catalogsearch_fulltext' => [
                'partial_reindex' => 650,
                'mysql_get' => 850,
                'elastic_save' => 1000
            ],
            'catalog_product_price' => [
                'simple' => 650,
                'default' => 850,
                'configurable' => 1000
            ],
            'catalogpermissions_category' => 1000,
            'inventory' => [
                'simple' => 650,
                'default' => 850,
                'configurable' => 1000
            ]
        ]
    ],
    'cron_consumers_runner' => [
    'cron_run' => true,
    'max_messages' => 5,
    'single_thread' => true,
    'consumers_wait_for_messages' => 0,
    'consumers' => [
            'async.operations.all',
            'catalog_website_attribute_value_sync',
            'codegenerator',
            'export',
            'inventory.indexer.sourceItem',
            'inventory.indexer.stock',
            'inventory.mass.update',
            'inventory.reservations.cleanup',
            'inventory.reservations.update',
            'inventory.reservations.updateSalabilityStatus',
            'inventory.source.items.cleanup',
            'media.content.synchronization',
            'media.gallery.renditions.update',
            'media.gallery.synchronization',
            'media.storage.catalog.image.resize',
            'product_action_attribute.update',
            'product_action_attribute.website.update',
            'product_alert.queue',
            'sales.rule.quote.trigger.recollect',
            'sales.rule.update.coupon.usage',
            'saveConfig'
        ]
    ],
    'crypt' => [
        'key' => getenv('CRYPT_KEY')
    ],
    'db' => [
        'table_prefix' => '',
        'connection' => [
            'default' => [
                'host' => 'mariadb',
                'dbname' => getenv('MARIADB_DATABASE'),
                'username' => getenv('MARIADB_USER'),
                'password' => getenv('MARIADB_PASSWORD'),
                'model' => 'mysql4',
                'engine' => 'innodb',
                'initStatements' => 'SET NAMES utf8;',
                'active' => '1',
                'profiler' => [
                  'class' => '\Magento\Framework\DB\Profiler',
                  'enabled' => (bool)($_SERVER['PROFILER') ?? false),
                   ],
                'driver_options' => [
                    1014 => false
                ]
            ]
        ]
    ],
    'resource' => [
        'default_setup' => [
            'connection' => 'default'
        ]
    ],
    'MAGE_MODE' => "production",
    'session' => [
        'save' => 'redis',
        'redis' => [
            'host' => 'session',
            'port' => '6379',
            'password' => getenv('REDIS_PASSWORD'),
            'timeout' => '2.5',
            'persistent_identifier' => getenv('BRAND').'_sess',
            'database' => '0',
            'compression_threshold' => '2048',
            'compression_library' => 'lz4',
            'log_level' => '3',
            'max_concurrency' => '20',
            'break_after_frontend' => '5',
            'break_after_adminhtml' => '30',
            'first_lifetime' => '600',
            'bot_first_lifetime' => '60',
            'bot_lifetime' => '7200',
            'disable_locking' => '0',
            'min_lifetime' => '60',
            'max_lifetime' => '2592000',
            'sentinel_master' => '',
            'sentinel_servers' => '',
            'sentinel_connect_retries' => '5',
            'sentinel_verify_master' => '0'
        ]
    ],
    'cache' => [
        'graphql' => [
            'id_salt' => getenv('GRAPHQL_ID_SALT')
        ],
        'frontend' => [
            'default' => [
                'id_prefix' => getenv('BRAND').'_',
                'backend' => 'Magento\\Framework\\Cache\\Backend\\Redis',
                'backend_options' => [
                    'server' => 'cache',
                    'database' => '0',
                    'persistent' => getenv('BRAND').'_cache',
                    'port' => '6380',
                    'password' => getenv('REDIS_PASSWORD'),
                    'compress_data' => '1',
                    'compression_lib' => 'l4z',
                    '_useLua' => true,
                    'use_lua' => true,
                    'preload_keys' => [
                      getenv('BRAND').'_EAV_ENTITY_TYPES',
                      getenv('BRAND').'_GLOBAL_PLUGIN_LIST',
                      getenv('BRAND').'_DB_IS_UP_TO_DATE',
                      getenv('BRAND').'_SYSTEM_DEFAULT',
               ]
		   ]
	   ]
    ],
      'allow_parallel_generation' => false
    ],
    'lock' => [
        'provider' => 'db'
    ],
    'directories' => [
        'document_root_is_pub' => true
    ],
    'http_cache_hosts' => [
        [
          'host' => 'varnish',
          'port' => '80'
        ]
    ],
    'cache_types' => [
        'config' => 1,
        'layout' => 1,
        'block_html' => 1,
        'collections' => 1,
        'reflection' => 1,
        'db_ddl' => 1,
        'compiled_config' => 1,
        'eav' => 1,
        'customer_notification' => 1,
        'full_page' => 1,
        'config_integration' => 1,
        'config_integration_api' => 1,
        'translate' => 1,
        'config_webservice' => 1
    ],
    'downloadable_domains' => [
        getenv('DOMAIN')
    ],
    'system' => [
        'default' => [
            'catalog' => [
                'search' => [
                    'engine' => 'opensearch',
                    'opensearch_server_hostname' => 'opensearch',
                    'opensearch_enable_auth' => '1',
                    'opensearch_server_port' => '9200',
                    'opensearch_index_prefix' => getenv('BRAND'),
                    'opensearch_username' => getenv('BRAND'),
                    'opensearch_password' => getenv('OPENSEARCH_PASSWORD')
                ]
            ]
        ]
    ],
    'install' => [
        'date' => 'Thu, 11 Aug 2022 10:47:18 +0000'
    ]
];
