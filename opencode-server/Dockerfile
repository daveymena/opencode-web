FROM node:20-alpine

ENV NODE_ENV=production \
    DEBIAN_FRONTEND=noninteractive

# ── Dependencias del sistema ──────────────────────────────────
RUN apk add --no-cache \
      curl \
      ca-certificates \
      git \
      openssh-client \
      sudo \
      bash \
      jq \
      sqlite \
      postgresql-client

# ── Usuario no-root ───────────────────────────────────────────
RUN addgroup -g 1000 opencode \
    && adduser -D -u 1000 -G opencode opencode \
    && echo "opencode ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/opencode \
    && chmod 0440 /etc/sudoers.d/opencode \
    && mkdir -p /workspace \
    && chown opencode:opencode /workspace

USER opencode
WORKDIR /home/opencode
ENV HOME=/home/opencode

# ── Instalar OpenCode ─────────────────────────────────────────
RUN curl -fsSL https://opencode.ai/install | bash
ENV PATH=/home/opencode/.opencode/bin:/home/opencode/.local/bin:$PATH

# ── Directorios de datos ──────────────────────────────────────
RUN mkdir -p \
    /home/opencode/.config/opencode/users \
    /home/opencode/.local/share/opencode/users

# ── Instalar dependencias Node.js ────────────────────────────
WORKDIR /app
COPY --chown=opencode:opencode package.json package-lock.json* ./
RUN npm ci --production --no-audit --no-fund 2>/dev/null || npm install --production --no-audit --no-fund

# ── Copiar código fuente ──────────────────────────────────────
COPY --chown=opencode:opencode server/ ./server/
COPY --chown=opencode:opencode public/ ./public/
COPY --chown=opencode:opencode opencode.json /home/opencode/.config/opencode/opencode.json

EXPOSE 4096

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -f http://localhost:4096/login || exit 1

CMD ["node", "server/index.js"]
