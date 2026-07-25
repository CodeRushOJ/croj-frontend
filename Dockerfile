ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22.23.1-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3
ARG NGINX_IMAGE=ghcr.io/nginx/nginx-unprivileged:1.29.4-alpine3.23@sha256:a6c4f61f456b85b8fdf7ec7ab28cc3e299440e6fb4a9dea520e5fd8fd440025e

FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS build

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=croj-frontend-pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

RUN pnpm build

FROM ${NGINX_IMAGE} AS runtime

ARG BUILD_DATE=1970-01-01T00:00:00Z
ARG OCI_SOURCE=https://github.com/CodeRushOJ/croj-frontend.git
ARG VCS_REF=unknown
ARG VERSION=0.1.0

LABEL org.opencontainers.image.title="CodeRushOJ Frontend" \
      org.opencontainers.image.description="CodeRushOJ Vue static web application" \
      org.opencontainers.image.url="https://github.com/CodeRushOJ/croj-frontend" \
      org.opencontainers.image.source="${OCI_SOURCE}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="NOASSERTION"

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

USER 101:101
EXPOSE 8080
STOPSIGNAL SIGQUIT

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:8080/healthz"]

ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
