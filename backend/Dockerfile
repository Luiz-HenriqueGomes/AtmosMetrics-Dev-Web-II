# ╔══════════════════════════════════════════════════════════════╗
# ║  AtmosMetrics — Backend Dockerfile (FastAPI/Python)         ║
# ║                                                              ║
# ║  Multi-stage build com 3 targets:                            ║
# ║    • base         → Dependências de sistema e pip            ║
# ║    • development  → Hot-reload com uvicorn (dev local)       ║
# ║    • production   → Gunicorn, não-root, tini, otimizado      ║
# ║                                                              ║
# ║  Build:                                                      ║
# ║    Dev:  docker build --target development -t atmos-api .    ║
# ║    Prod: docker build --target production  -t atmos-api .    ║
# ╚══════════════════════════════════════════════════════════════╝


# ==============================================================
# Stage 1: BASE — Imagem base com dependências de sistema
# ==============================================================
# Usamos python:3.12-slim como base para manter a imagem enxuta.
# Apenas dependências de sistema indispensáveis são instaladas.
# ==============================================================

FROM python:3.12-slim AS base

# Metadados OCI (Open Container Initiative) padronizados
# https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.title="AtmosMetrics API"
LABEL org.opencontainers.image.description="API de monitoramento socioambiental global — FastAPI + SQLAlchemy + PostGIS"
LABEL org.opencontainers.image.authors="Luiz Henrique Gomes de Oliveira, Kaio Correia"
LABEL org.opencontainers.image.version="2.0.0"
LABEL org.opencontainers.image.source="https://github.com/Luiz-HenriqueGomes/AtmosMetrics-Dev-Web-II"
LABEL org.opencontainers.image.licenses="MIT"

# Variáveis de ambiente do Python (best practices para containers)
# PYTHONDONTWRITEBYTECODE=1 → Não gera .pyc (desnecessário em container)
# PYTHONUNBUFFERED=1        → Output direto no stdout (logs em tempo real)
# PIP_NO_CACHE_DIR=1        → Não armazena cache do pip (imagem menor)
# PIP_DISABLE_PIP_VERSION_CHECK=1 → Não checa atualizações do pip
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instala dependências de sistema necessárias para compilar psycopg2
# --no-install-recommends → Não instala pacotes sugeridos (imagem menor)
# rm -rf /var/lib/apt/lists/* → Limpa cache do apt (imagem menor)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
        tini \
    && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /backend

# Copia APENAS requirements primeiro (otimiza cache de layers)
# Se o código mudar mas as dependências não, essa layer é reutilizada
COPY requirements.txt ./

# Instala dependências Python de produção
RUN pip install --no-cache-dir -r requirements.txt


# ==============================================================
# Stage 2: DEVELOPMENT — Hot-reload para desenvolvimento local
# ==============================================================
# Target para docker compose --profile dev.
# Inclui dependências de teste e roda com --reload.
# O código é montado via volume (não copiado).
# ==============================================================

FROM base AS development

# Copia e instala dependências de desenvolvimento/teste
COPY requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copia o código (será sobrescrito pelo volume mount em dev)
COPY . .

# Expõe a porta da API
EXPOSE 8000

# Inicia uvicorn com hot-reload para desenvolvimento
# --reload: reinicia o servidor a cada alteração no código
# --reload-dir: monitora apenas o diretório da aplicação
CMD ["python", "-m", "uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--reload", \
     "--reload-dir", "app", \
     "--reload-dir", "etl"]


# ==============================================================
# Stage 3: PRODUCTION — Imagem final otimizada para produção
# ==============================================================
# Imagem mínima, segura e performática:
#   • Usuário não-root (appuser)
#   • Tini como init (PID 1 correto, signal forwarding)
#   • Gunicorn com workers (paralelismo real)
#   • Health check nativo do Docker
#   • Sem dependências de teste/dev
# ==============================================================

FROM base AS production

# Cria usuário não-root para segurança
# Containers NUNCA devem rodar como root em produção
RUN groupadd --gid 1001 appgroup && \
    useradd  --uid 1001 --gid appgroup --shell /bin/false --create-home appuser

# Copia código da aplicação com ownership do appuser
COPY --chown=appuser:appgroup . .

# Remove arquivos desnecessários que passaram pelo .dockerignore
# (camada extra de segurança)
RUN rm -rf tests/ scripts/ requirements-dev.txt *.md

# Alterna para usuário não-root
USER appuser

# Expõe a porta da API
EXPOSE 8000

# Health check nativo — Docker monitora a saúde do container
# Se falhar 3 vezes consecutivas, Docker marca como "unhealthy"
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

# Tini como entrypoint (PID 1 correto)
# Garante que signals (SIGTERM, SIGINT) são propagados corretamente
# Evita processos zumbi dentro do container
ENTRYPOINT ["tini", "--"]

# Gunicorn com UvicornWorker para paralelismo real em produção
# --workers: processos paralelos (2x CPU cores + 1 é a fórmula comum)
# --worker-class: usa o loop assíncrono do Uvicorn dentro do Gunicorn
# --access-logfile -: logs no stdout (capturados pelo Docker)
# --timeout: tempo máximo de resposta (ETLs podem demorar)
# --graceful-timeout: tempo para finalizar requests em andamento
CMD ["gunicorn", "app.main:app", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--timeout", "120", \
     "--graceful-timeout", "30", \
     "--keep-alive", "5"]
