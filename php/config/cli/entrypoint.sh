#!/bin/sh
set -e

# If first argument is "n98", run n98-magerun2
if [ "$1" = "n98" ]; then
  shift
  exec /bin/sh -c "php /usr/local/bin/n98-magerun2 $*"
  exit $?
fi

# If first argument is "composer", run composer
if [ "$1" = "composer" ]; then
  shift
  exec /bin/sh -c "php /usr/local/bin/composer $*"
  exit $?
fi

# For any other command, default to bin/magento
exec /bin/sh -c "php bin/magento $*"
