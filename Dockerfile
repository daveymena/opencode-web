FROM node:20-alpine

# ── Dependencias del sistema ───────────────────────────────
RUN apk add --no-cache \
      curl \
      ca-certificates \
      git \
      openssh-client \
      bash \
      jq \
      sqlite \
      postgresql-client \
      sudo

# ── Usuario no-root (1001 — 1000 lo usa el usuario 'node' de esta imagen) ──
RUN addgroup -g 1001 opencode \
    && adduser -D -u 1001 -G opencode -s /bin/bash opencode \
    && echo "opencode ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/opencode \
    && chmod 0440 /etc/sudoers.d/opencode \
    && mkdir -p /workspace \
    && chown opencode:opencode /workspace

USER opencode
WORKDIR /home/opencode
ENV HOME=/home/opencode

# ── Instalar OpenCode ──────────────────────────────────────
RUN curl -fsSL https://opencode.ai/install | bash
ENV PATH=/home/opencode/.opencode/bin:/home/opencode/.local/bin:$PATH

# ── Directorios de datos ───────────────────────────────────
RUN mkdir -p \
    /home/opencode/.config/opencode/users \
    /home/opencode/.local/share/opencode/users

# ── Instalar dependencias Node.js ──────────────────────────
WORKDIR /app
COPY --chown=opencode:opencode opencode-server/package.json ./
RUN npm install --production

# ── Copiar código fuente ───────────────────────────────────
COPY --chown=opencode:opencode opencode-server/server/ ./server/
COPY --chown=opencode:opencode opencode-server/public/ ./public/
COPY --chown=opencode:opencode opencode-server/opencode.json /home/opencode/.config/opencode/opencode.json

EXPOSE 4096

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -f http://localhost:4096/login || exit 1

CMD ["node", "server/index.js"]
