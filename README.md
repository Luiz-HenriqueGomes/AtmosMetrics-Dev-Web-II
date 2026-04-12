# AtmosMetrics

> Sistema de monitoramento socioambiental com dados do INPE e IBGE — Projeto Dev Web II

## 📌 Status Atual

**Fase 1 — Banco de Dados: ✅ CONCLUÍDA**

**Próxima etapa → Fase 2: ETL (ingestão de dados do INPE)**

---

## 🎯 Sobre o Projeto

O **AtmosMetrics** é uma plataforma web para centralizar, processar e visualizar dados críticos de monitoramento ambiental do Brasil, com foco inicial em **focos de calor (queimadas)** fornecidos pelo INPE.

**Fontes de dados:**
- **INPE / Programa Queimadas** → focos de calor detectados por satélite
- **IBGE** → dados geográficos e socioeconômicos

**Stack planejada:**
- **Banco de dados:** PostgreSQL 16 + PostGIS 3.4 (via Docker)
- **ETL:** Python (a implementar na Fase 2)
- **Backend / API:** A definir
- **Frontend / Dashboard:** A definir

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

# 4. Suba o banco de dados
docker compose up -d

# 5. Verifique se está funcionando (aguarde ~30s)
docker compose ps
docker compose exec db psql -U atmos_user -d atmosmetrics -c "\dt"
```

**Resultado esperado no passo 5:** 4 tabelas listadas (`dim_tempo`, `dim_satelite`, `dim_localidade`, `fato_anomalia_termica`)

---

## 📋 Roadmap do Projeto

### Fase 1 — Banco de Dados ✅
- [x] Modelagem Star Schema com PostGIS
- [x] Docker Compose para PostgreSQL 16
- [x] Pré-população: 27 estados brasileiros + 13 satélites INPE
- [x] Índices espaciais e trigger automático de geom

### Fase 2 — ETL (próxima) 🔜
- [ ] Script Python para consumir API/arquivos do INPE (focos de calor)
- [ ] Transformação e carga na `fato_anomalia_termica`
- [ ] Carga da `dim_tempo` com calendário completo
- [ ] Carga completa de municípios brasileiros na `dim_localidade`
- [ ] Agendamento da ingestão (cron / scheduler)

### Fase 3 — Backend / API 🔜
- [ ] A definir

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
└── database/
    ├── README.md               # Documentação do banco
    └── init/
        ├── 01_schema.sql       # Criação do Star Schema
        └── 02_populate.sql     # Seed das dimensões
```

---

## ℹ️ Contexto para o Antigravity (nova máquina)

Ao abrir este projeto em uma nova instalação do Antigravity, informe:

> *"Leia o README.md e continue o projeto AtmosMetrics. A Fase 1 (banco de dados) está concluída. Precisamos implementar a Fase 2: ETL em Python para ingerir dados de focos de calor da API do INPE e carregar na tabela `fato_anomalia_termica` e nas dimensões restantes."*

O Antigravity vai ler o workspace e terá todo o contexto necessário para continuar.
