#!/bin/zsh
set -e

project_dir="${0:A:h}"
cd "$project_dir"

python3 -u -m http.server 8084 --bind 127.0.0.1 --directory host &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM

sleep 0.5
open "http://127.0.0.1:8084/"
wait "$server_pid"
