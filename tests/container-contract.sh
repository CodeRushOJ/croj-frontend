#!/bin/sh
set -eu

image=${1:-coderushoj/croj-frontend:contract}
revision=${CROJ_IMAGE_REVISION:-0000000000000000000000000000000000000000}
version=${CROJ_IMAGE_VERSION:-0.1.0-contract}
source_url=${CROJ_IMAGE_SOURCE:-https://github.com/CodeRushOJ/croj-frontend.git}

if [ "${CROJ_SKIP_IMAGE_BUILD:-0}" != "1" ]; then
  docker buildx build \
    --load \
    --build-arg "VCS_REF=$revision" \
    --build-arg "VERSION=$version" \
    --build-arg "BUILD_DATE=2026-01-01T00:00:00Z" \
    --build-arg "OCI_SOURCE=$source_url" \
    --tag "$image" \
    .
fi

inspect_json=$(docker image inspect "$image")
printf '%s' "$inspect_json" | jq -e \
  --arg revision "$revision" \
  --arg version "$version" \
  --arg source "$source_url" '
    .[0].Config.User == "101:101" and
    .[0].Config.ExposedPorts["8080/tcp"] != null and
    (.[0].Config.Healthcheck.Test | join(" ") | contains("127.0.0.1:8080/healthz")) and
    .[0].Config.Labels["org.opencontainers.image.revision"] == $revision and
    .[0].Config.Labels["org.opencontainers.image.version"] == $version and
    .[0].Config.Labels["org.opencontainers.image.source"] == $source
  ' >/dev/null

# Keep runtime validation in one disposable container. It uses the same
# UID/GID, read-only root filesystem and writable mounts as croj-platform.
docker run --rm \
  --read-only \
  --user 101:101 \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m,uid=101,gid=101 \
  --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=16m,uid=101,gid=101 \
  --tmpfs /var/run:rw,noexec,nosuid,size=1m,uid=101,gid=101 \
  --entrypoint sh \
  "$image" -ec '
    test "$(id -u)" = 101
    test "$(id -g)" = 101
    ! touch /usr/share/nginx/html/contract-write
    nginx -t
    nginx
    trap "nginx -s quit >/dev/null 2>&1 || true" EXIT INT TERM

    attempt=0
    until wget -qO /tmp/health http://127.0.0.1:8080/healthz; do
      attempt=$((attempt + 1))
      if [ "$attempt" -ge 30 ]; then
        exit 1
      fi
      sleep 1
    done
    test "$(cat /tmp/health)" = "ok"

    wget -S -O /tmp/index.html http://127.0.0.1:8080/ 2>/tmp/index.headers
    wget -S -O /tmp/history.html http://127.0.0.1:8080/contests/42/scoreboard 2>/tmp/history.headers
    cmp /tmp/index.html /tmp/history.html
    grep -qi "Cache-Control: no-cache" /tmp/history.headers
    grep -qi "X-Content-Type-Options: nosniff" /tmp/history.headers
    grep -qi "X-Frame-Options: SAMEORIGIN" /tmp/history.headers
    grep -qi "Content-Security-Policy:" /tmp/history.headers
    grep -qi "Referrer-Policy: strict-origin-when-cross-origin" /tmp/history.headers

    asset_path=$(sed -n "s/.*src=\"\\([^\"]*\\/assets\\/[^\"]*\\.js\\)\".*/\\1/p" /tmp/index.html | head -n 1)
    test -n "$asset_path"
    wget -S --spider "http://127.0.0.1:8080$asset_path" 2>/tmp/asset.headers
    grep -qi "Cache-Control: public, max-age=31536000, immutable" /tmp/asset.headers
    test "$(grep -ic "Cache-Control:" /tmp/asset.headers)" = 1

    ! wget -S -O /dev/null http://127.0.0.1:8080/api/v1/problems 2>/tmp/api.headers
    grep -q "404 Not Found" /tmp/api.headers
    ! wget -S -O /dev/null \
      --header="Connection: Upgrade" \
      --header="Upgrade: websocket" \
      http://127.0.0.1:8080/api/ws 2>/tmp/ws.headers
    grep -q "404 Not Found" /tmp/ws.headers
  '
