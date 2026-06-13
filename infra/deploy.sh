#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

CONTEXT_FLAGS=""

if [ -f "$ENV_FILE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="$(echo "$line" | sed 's/#.*//' | xargs)"
    [ -z "$line" ] && continue
    key="${line%%=*}"
    value="${line#*=}"
    if [ "$key" = "PROFILE" ]; then
      export AWS_PROFILE="$value"
    else
      CONTEXT_FLAGS="$CONTEXT_FLAGS -c ${key}=${value}"
    fi
  done < "$ENV_FILE"
fi

npx cdk deploy $CONTEXT_FLAGS "$@"
