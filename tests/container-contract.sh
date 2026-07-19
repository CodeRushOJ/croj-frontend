#!/bin/sh
set -eu

image=${1:-coderushoj/croj-frontend:contract}
skip_build=${CROJ_SKIP_IMAGE_BUILD:-0}

if [ "$skip_build" != "1" ]; then
  docker build --pull=false --tag "$image" .
  docker build --pull=false --build-arg VITE_ENABLE_PREVIEW_MOCK_AUTH=true --tag "$image-preview-arg" .
  docker run --rm --entrypoint sh "$image-preview-arg" -ec \
    '! grep -R -F "coderushoj-local-preview" /usr/share/nginx/html'
fi

inspect_json=$(docker image inspect "$image")
printf '%s' "$inspect_json" | jq -e '
  .[0].Config.User == "101:101" and
  .[0].Config.ExposedPorts["8080/tcp"] != null and
  (.[0].Config.Healthcheck.Test | join(" ") | contains("127.0.0.1:8080/healthz")) and
  .[0].Config.Labels["org.opencontainers.image.source"] == "https://github.com/CodeRushOJ/croj-frontend" and
  .[0].Config.Labels["org.opencontainers.image.licenses"] == "NOASSERTION"
' >/dev/null

docker run --rm --entrypoint sh "$image" -ec \
  '! grep -R -F "coderushoj-local-preview" /usr/share/nginx/html'

container_name="croj-frontend-contract-$$"
test_dir=$(mktemp -d)
cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  rm -rf "$test_dir"
}
trap cleanup EXIT INT TERM

docker run --detach --name "$container_name" \
  --read-only \
  --user 101:101 \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m,uid=101,gid=101 \
  --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=16m,uid=101,gid=101 \
  --tmpfs /var/run:rw,noexec,nosuid,size=1m,uid=101,gid=101 \
  --publish 127.0.0.1::8080 \
  "$image" >/dev/null

host_port=$(docker port "$container_name" 8080/tcp | sed -n '1s/.*://p')
test -n "$host_port"
base_url="http://127.0.0.1:$host_port"

attempt=0
until curl --fail --silent --show-error "$base_url/healthz" >"$test_dir/health"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    docker logs "$container_name" >&2
    exit 1
  fi
  sleep 1
done

test "$(cat "$test_dir/health")" = "ok"
docker inspect "$container_name" | jq -e '
  .[0].Config.User == "101:101" and
  .[0].HostConfig.ReadonlyRootfs == true and
  .[0].State.Running == true
' >/dev/null

curl --fail --silent --show-error --dump-header "$test_dir/spa.headers" \
  "$base_url/contests/42/scoreboard" >"$test_dir/spa.html"
grep -q '<div id="app"></div>' "$test_dir/spa.html"
tr -d '\r' <"$test_dir/spa.headers" | grep -qi '^Cache-Control: no-cache'
tr -d '\r' <"$test_dir/spa.headers" | grep -qi '^X-Content-Type-Options: nosniff$'
tr -d '\r' <"$test_dir/spa.headers" | grep -qi '^X-Frame-Options: SAMEORIGIN$'
tr -d '\r' <"$test_dir/spa.headers" | grep -qi '^Content-Security-Policy:'

asset_path=$(sed -n 's/.*src="\([^"]*\/assets\/[^"]*\.js\)".*/\1/p' "$test_dir/spa.html" | head -n 1)
test -n "$asset_path"
curl --fail --silent --show-error --output /dev/null --dump-header "$test_dir/asset.headers" "$base_url$asset_path"
tr -d '\r' <"$test_dir/asset.headers" | grep -qi '^Cache-Control: public, max-age=31536000, immutable$'

api_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$base_url/api/v1/problems")
test "$api_status" = "404"
