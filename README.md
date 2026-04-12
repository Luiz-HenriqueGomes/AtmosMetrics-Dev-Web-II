# AtmosMetrics

> Sistema de monitoramento socioambiental com dados do INPE e IBGE — Projeto Dev Web II

## 📌 Status Atual

**Fase 1 — Banco de Dados: ✅ CONCLUÍDA**

**Fases 2 e 3 — ETL e Backend API: ✅ CONCLUÍDAS**

**Próxima etapa → Fase 4: Frontend / Dashboard**

---

## 🎯 Sobre o Projeto

O **AtmosMetrics** é uma plataforma web para centralizar, processar e visualizar dados críticos de monitoramento ambiental do Brasil, com foco inicial em **focos de calor (queimadas)** fornecidos pelo INPE.

**Fontes de dados:**
- **INPE / Programa Queimadas** → focos de calor detectados por satélite
- **IBGE** → dados geográficos e socioeconômicos

**Stack planejada:**
- **Banco de dados:** PostgreSQL 16 + PostGIS 3.4 (via Docker)
- **ETL e Backend:** Python + FastAPI + SQLAlchemy + Pydantic
- **Frontend / Dashboard:** A definir na Fase 4

---

## 🏗️ Arquitetura do Banco de Dados (Star Schema)

```
             ┌──────────────┐
             │  dim_tempo   │
             │  (Quando?)   │
             └──────┬───────┘
                    │ FK
┌──────────────┐    │    ┌──────────────────────────┐
│ dim_satelite │────┼────│  fato_anomalia_termica   │
│  (Quem?)     │  FK│ FK │  (O foco de calor!)      │
└──────────────┘    │    └──────────────────────────┘
                    │ FK
             ┌──────┴────────┐
             │dim_localidade │
             │   (Onde?)     │
             └───────────────┘
```

### Tabelas criadas

| Tabela | Tipo | Descrição |
|---|---|---|
| `dim_tempo` | Dimensão | Hierarquia temporal (dia/mês/ano/trimestre/semestre) |
| `dim_satelite` | Dimensão | 13 satélites do INPE pré-cadastrados |
| `dim_localidade` | Dimensão | 27 estados + biomas + regiões pré-cadastrados |
| `fato_anomalia_termica` | Fato | Registros de focos de calor com coordenadas PostGIS |

---

## 🚀 Setup — Nova Máquina

### Pré-requisitos
- [ ] [Git](https://git-scm.com/downloads) instalado
- [ ] [Docker Desktop](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe) instalado e rodando

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/Luiz-HenriqueGomes/AtmosMetrics-Dev-Web-II.git AtmosMetrics
cd AtmosMetrics

# 2. Configure o Git
git config --global user.name "Luiz-HenriqueGomes"
git config --global user.email "luiz12henrique21@gmail.com"

# 3. Crie o .env (o arquivo real NÃO está no GitHub por segurança)
copy .env.example .env
# Edite o .env e defina uma senha segura para POSTGRES_PASSWORD

# 4. Suba a infraestrutura (Banco + Backend)
docker compose up -d --build

# 5. Verifique se a API e o Banco estão rodando
# Acesse a documentação gerada automaticamente no seu navegador:
# http://localhost:8000/docs
```

**Resultado esperado no passo 5:** A página do Swagger UI abrirá mostrando todas as rotas da API AtmosMetrics (Anomalias, Localidades, ETL).

---

## 📋 Roadmap do Projeto

### Fase 1 — Banco de Dados ✅
- [x] Modelagem Star Schema com PostGIS
- [x] Docker Compose para PostgreSQL 16
- [x] Pré-população: 27 estados brasileiros + 13 satélites INPE
- [x] Índices espaciais e trigger automático de geom

### Fase 2 — ETL ✅
- [x] Script Python para consumir API/arquivos do INPE (focos de calor diários)
- [x] Transformação das strings, lat/lon e extração de data/hora
- [x] Carga Upsert na `fato_anomalia_termica`, `dim_tempo`, `dim_localidade` e `dim_satelite`
- [x] Endpoint de disparo manual configurado (`/api/v1/etl/executar`)

### Fase 3 — Backend / API ✅
- [x] Configuração FastAPI no Docker com mapeamento de volume para hot-reload
- [x] Conexão com o PostGIS via GeoAlchemy2
- [x] Modelos ORM e Schemas Pydantic mapeando o Star Schema
- [x] Endpoint de Anomalias com paginação e filtros (data, uf, bioma, satélite)
- [x] Endpoint de Resumos e Agregadores para o Dashboard

### Fase 4 — Frontend / Dashboard 🔜
- [ ] A definir

---

## 📁 Estrutura do Projeto

```
AtmosMetrics/
├── .agents/
│   └── workflows/
│       └── setup-ambiente.md   # Workflow de setup automático
├── .env.example                # Template de variáveis de ambiente
├── .gitignore                  # .env e dados sensíveis protegidos
├── docker-compose.yml          # PostgreSQL 16 + PostGIS 3.4
├── README.md                   # Este arquivo
├── backend/
│   ├── app/                    # Rotas, modelos ORM, schemas (FastAPI)
│   ├── etl/                    # Scripts de ingestão de dados do INPE
│   ├── Dockerfile              # Imagem do servidor web (API)
│   └── requirements.txt        # Dependências (FastAPI, SQLAlchemy, Pandas)
└── database/
    ├── README.md               # Documentação do banco
    └── init/
        ├── 01_schema.sql       # Criação do Star Schema
        └── 02_populate.sql     # Seed das dimensões
```

---

## ℹ️ Contexto para o Antigravity (nova máquina)

Ao abrir este projeto em uma nova instalação do Antigravity, informe:

> *"Leia o README.md e continue o projeto AtmosMetrics. As Fases 1, 2 e 3 (Banco, ETL e API backend no Docker) estão concluídas. Precisamos agora implementar a Fase 4: O Frontend / Dashboard consumindo os dados de http://localhost:8000."*

O Antigravity vai ler o workspace e terá todo o contexto necessário para continuar.
