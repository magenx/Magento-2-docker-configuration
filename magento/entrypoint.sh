#!/bin/sh
set -e

RELEASES_PATH="$ROOT_PATH/releases"
CURRENT_PATH="$ROOT_PATH/current"

# Make sure releases dir exists
mkdir -p "$RELEASES_PATH"

# Pick latest release
LATEST=$(ls -1 "$RELEASES_PATH" 2>/dev/null | sort | tail -n 1)

if [ -n "$LATEST" ]; then
  echo "Updating symlink: $CURRENT_PATH -> $LATEST"

  # Remove existing dir if Docker created it instead of a symlink
  if [ -d "$CURRENT_PATH" ] && [ ! -L "$CURRENT_PATH" ]; then
    rm -rf "$CURRENT_PATH"
  fi

  # Point symlink to latest release
  ln -sfn "$RELEASES_PATH/$LATEST" "$CURRENT_PATH"
else
  echo "No releases found in $RELEASES_PATH"
fi


exec n98-magerun2 -vv "$@"

