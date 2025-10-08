#!/bin/sh
set -e

# If first argument is "n98", run n98-magerun2
if [ "$1" = "n98" ]; then
  shift
  exec n98-magerun2 "$@"
fi

# For any other command, default to bin/magento
exec php bin/magento "$@"
