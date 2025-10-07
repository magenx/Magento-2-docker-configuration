#!/bin/sh
set -e

# If no command provided, default to a long-running process
if [ $# -eq 0 ]; then
  exec tail -f /dev/null
fi

# If first argument is "n98", run n98-magerun2
if [ "$1" = "n98" ]; then
  shift
  exec n98-magerun2 "$@"
fi

# For any other command, default to bin/magento
exec php bin/magento "$@"
