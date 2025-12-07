#!/bin/zsh
set -euo pipefail

# Copy any .env files from the repo root into the workspace
for envfile in ".env" ".env.local"; do
  if [ -f "$CONDUCTOR_ROOT_PATH/$envfile" ] && [ ! -f "$envfile" ]; then
    cp "$CONDUCTOR_ROOT_PATH/$envfile" "$envfile"
  fi
done

# Copy nested .env files for backend and cli if they exist in the repo root
for dir in "backend" "cli"; do
  for envfile in ".env" ".env.local"; do
    if [ -f "$CONDUCTOR_ROOT_PATH/$dir/$envfile" ] && [ ! -f "$dir/$envfile" ]; then
      cp "$CONDUCTOR_ROOT_PATH/$dir/$envfile" "$dir/$envfile"
    fi
  done
done

echo "Conductor setup complete."
