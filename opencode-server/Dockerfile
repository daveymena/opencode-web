FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

# ── Dependencias del sistema ──────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      git \
      openssh-client \
      sudo \
      bash \
      jq \
      sqlite3 \
      postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 ────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Usuario no-root ───────────────────────────────────────────
RUN useradd -m -s /bin/bash opencode \
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
RUN npm install --production --no-audit --no-fund

# ── Copiar código fuente ──────────────────────────────────────
COPY --chown=opencode:opencode server/ ./server/
COPY --chown=opencode:opencode public/ ./public/
COPY --chown=opencode:opencode opencode.json /home/opencode/.config/opencode/opencode.json

EXPOSE 4096

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -f http://localhost:4096/login || exit 1

CMD ["node", "server/index.js"]
