FROM node:26.12.1-bookworm@sha256:3b764117159bda01d2396391e7789b6a9106af9729cfd001ef55e98557868310
# npm 12.2.1 still bundles Undici 6.29.0; patch that package below until upstream includes 6.29.1.
ARG NPM_VERSION=12.2.1
ARG CODEX_VERSION=0.155.1
ARG PLAYWRIGHT_VERSION=1.63.0
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright \
    TRON_BROWSER_CHANNEL=chromium \
    CODEX_HOME=/home/node/.codex
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
      ca-certificates curl git ripgrep python3 ffmpeg \
    && npm install -g npm@${NPM_VERSION} \
    && npm install --prefix /tmp/npm-undici-patch undici@6.29.1 --ignore-scripts \
    && rm -rf /usr/local/lib/node_modules/npm/node_modules/undici \
    && cp -a /tmp/npm-undici-patch/node_modules/undici /usr/local/lib/node_modules/npm/node_modules/undici \
    && rm -rf /tmp/npm-undici-patch \
    && npm install -g @openai/codex@${CODEX_VERSION} playwright@${PLAYWRIGHT_VERSION} \
    && playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci \
    && sha256sum package.json package-lock.json > node_modules/.tron-dependency-hash \
    && mkdir -p /home/node/.codex /home/node/.npm \
    && chown -R node:node /workspace /home/node
COPY containers/codex/entrypoint.sh /usr/local/bin/tron-entrypoint
COPY containers/codex/check.mjs /usr/local/lib/tron-container-check.mjs
RUN chmod 755 /usr/local/bin/tron-entrypoint
USER node
ENTRYPOINT ["/usr/local/bin/tron-entrypoint"]
CMD ["codex", "--sandbox", "danger-full-access", "--ask-for-approval", "never", "-C", "/workspace"]
