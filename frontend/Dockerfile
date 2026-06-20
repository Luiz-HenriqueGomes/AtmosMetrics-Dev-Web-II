# ╔══════════════════════════════════════════════════════════════╗
# ║  AtmosMetrics — Frontend Dockerfile (React/Vite/NGINX)      ║
# ║                                                              ║
# ║  Multi-stage build com 4 targets:                            ║
# ║    • deps         → Instala dependências (npm ci)            ║
# ║    • builder      → Compila TypeScript + Vite build          ║
# ║    • development  → Vite dev server com HMR                  ║
# ║    • production   → NGINX Alpine servindo assets estáticos   ║
# ║                                                              ║
# ║  Build:                                                      ║
# ║    Dev:  docker build --target development -t atmos-web .    ║
# ║    Prod: docker build --target production  -t atmos-web .    ║
# ║                                                              ║
# ║  Tamanho final:                                              ║
# ║    Dev:  ~500MB (node_modules completo)                      ║
# ║    Prod: ~30MB  (apenas NGINX + assets minificados)          ║
# ╚══════════════════════════════════════════════════════════════╝


# ==============================================================
# Stage 1: DEPS — Instalação de dependências
# ==============================================================
# Separa a instalação de dependências do build para maximizar
# o reuso de cache. Se package.json não mudou, essa layer
# é reutilizada mesmo que o código fonte mude.
# ==============================================================

FROM node:20-alpine AS deps

# Metadados OCI (Open Container Initiative) padronizados
LABEL org.opencontainers.image.title="AtmosMetrics Frontend"
LABEL org.opencontainers.image.description="Dashboard de monitoramento socioambiental — React 19 + TypeScript + Vite"
LABEL org.opencontainers.image.authors="Luiz Henrique Gomes de Oliveira, Kaio Correia"
LABEL org.opencontainers.image.version="2.0.0"
LABEL org.opencontainers.image.source="https://github.com/Luiz-HenriqueGomes/AtmosMetrics-Dev-Web-II"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copia APENAS arquivos de dependência (maximiza cache de layers)
COPY package.json package-lock.json ./

# npm ci: instalação limpa e determinística (usa package-lock.json)
# --prefer-offline: prioriza cache local se disponível
# Diferente de `npm install`, `npm ci` garante reprodutibilidade
RUN npm ci


# ==============================================================
# Stage 2: BUILDER — Compilação e bundling
# ==============================================================
# Executa o build de produção do Vite (TypeScript → JavaScript).
# Gera os assets otimizados e minificados em /app/dist/.
# Esse stage existe apenas durante o build, não vai para a imagem.
# ==============================================================

FROM deps AS builder

# Copia o código fonte sobre os node_modules já instalados
COPY . .

# Build de produção:
# - TypeScript é compilado (tsc -b)
# - Vite faz tree-shaking, code-splitting e minificação
# - Assets recebem hash no nome para cache busting
RUN npm run build


# ==============================================================
# Stage 3: DEVELOPMENT — Vite dev server com HMR
# ==============================================================
# Target para docker compose --profile dev.
# Usa o Vite dev server com Hot Module Replacement.
# O código é montado via volume (não copiado), permitindo
# que alterações no host reflitam instantaneamente no container.
# ==============================================================

FROM deps AS development

# Copia o código (será sobrescrito pelo volume mount em dev)
COPY . .

# Expõe a porta do Vite dev server
EXPOSE 5173

# Inicia o Vite em modo desenvolvimento
CMD ["npm", "run", "dev"]


# ==============================================================
# Stage 4: PRODUCTION — NGINX Alpine servindo assets estáticos
# ==============================================================
# Imagem final ultra-leve (~30MB):
#   • NGINX Alpine como servidor web (não Node.js!)
#   • Apenas os assets estáticos compilados (/dist)
#   • Configuração NGINX com gzip, cache, security headers
#   • Proxy reverso para /api → backend
#   • Usuário não-root
#   • Health check nativo
# ==============================================================

FROM nginx:1.27-alpine AS production

# Metadados da imagem final
LABEL org.opencontainers.image.title="AtmosMetrics Frontend"
LABEL org.opencontainers.image.description="Dashboard de monitoramento socioambiental — Production (NGINX)"
LABEL org.opencontainers.image.authors="Luiz Henrique Gomes de Oliveira, Kaio Correia"
LABEL org.opencontainers.image.version="2.0.0"

# Remove a configuração padrão do NGINX
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copia nossa configuração customizada do NGINX
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copia APENAS os assets compilados do stage builder
# Essa é a magia do multi-stage: node_modules (500MB+) fica
# para trás, apenas os arquivos HTML/JS/CSS minificados (~5MB) vão
COPY --from=builder /app/dist /usr/share/nginx/html

# Ajusta permissões para que o NGINX rode como não-root
# O NGINX Alpine já vem com o user "nginx" (UID 101)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /tmp/nginx.pid && \
    chown -R nginx:nginx /tmp/nginx.pid

# Alterna para usuário não-root
USER nginx

# Expõe a porta 80 (padrão HTTP)
EXPOSE 80

# Health check nativo — Docker monitora a saúde do container
# Usa o endpoint /healthz definido no nginx.conf
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/healthz || exit 1

# NGINX roda em foreground (obrigatório para containers)
CMD ["nginx", "-g", "daemon off;"]
