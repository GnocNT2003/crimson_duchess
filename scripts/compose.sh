#!/usr/bin/env bash
# This script is used to start the development environment using Docker Compose.
# It will build and run the containers defined in the respective compose file.
# Environment variables are injected through Infisical CLI.

set -euo pipefail

usage() {
    echo "Usage: $0 -a <action> [-e <environment>] [-- <docker-compose-options>...]"
    echo ""
    echo "  -a  Docker Compose action to perform (e.g. up, down, build). Required."
    echo "  -e  Infisical environment slug name (e.g. dev, prod). Default: dev."
    echo "  --  Any additional options are passed to Docker Compose."
    exit 1
}

ACTION=""
ENVIRONMENT="dev"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -a) ACTION="$2"; shift 2 ;;
        -e) ENVIRONMENT="$2"; shift 2 ;;
        --) shift; break ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

if [[ -z "$ACTION" ]]; then
    echo "Error: -a <action> is required."
    usage
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$ENVIRONMENT" == "dev" ]]; then
    COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.dev.yml"
else
    COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "Error: Docker Compose file not found at path: $COMPOSE_FILE" >&2
    exit 1
fi

exec infisical run --env="$ENVIRONMENT" --path=/MongoDB --path=/Discord -- \
    docker compose -f "$COMPOSE_FILE" "$ACTION" "$@"
