---
title: "Documento Integrado: Análise, Especificação de Requisitos e Projeto de Design do Sistema AtmosMetrics"
author: "Luiz Henrique Gomes de Oliveira, Kaio Correia"
date: "Vitória - ES, 2026"
---

<div style="text-align: center; margin-top: 50px;">
  <h1>Documento Integrado: Análise, Especificação de Requisitos e Projeto de Design do Sistema AtmosMetrics</h1>
  <br>
  <h3>Luiz Henrique Gomes de Oliveira</h3>
  <h3>Kaio Correia</h3>
  <br><br><br>
  <p>Este documento integra as etapas de Análise e Especificação de Requisitos, e Projeto de Design do Sistema AtmosMetrics, com arquitetura desacoplada (API-Driven), desenvolvido como parte da avaliação do curso de Análise e Desenvolvimento de Sistemas.</p>
  <br><br>
  <p>Vitória - ES</p>
  <p>2026</p>
</div>

<div style="page-break-after: always;"></div>

## Sumário
1. [Etapa 1: Análise e Especificação de Requisitos](#etapa-1)
2. [Etapa 2: Projeto (Design) do Sistema](#etapa-2)
3. [Atualização Arquitetural e Otimizações](#etapa-3)

<div style="page-break-after: always;"></div>

<h2 id="etapa-1">1. Etapa 1: Análise e Especificação de Requisitos</h2>

Este capítulo detalha a fase inicial do projeto, fundamentando o problema a ser resolvido, os usuários-alvo e as fronteiras do sistema AtmosMetrics.

### 1.1 Definição do Problema
Atualmente, dados socioambientais cruciais, como focos de calor, desmatamento e índices de qualidade do ar, encontram-se descentralizados em diferentes portais governamentais e globais. Essa fragmentação dificulta a tomada de decisão rápida por parte de gestores públicos e analistas de sustentabilidade. O AtmosMetrics resolve esse problema criando uma plataforma centralizada que extrai, cruza e apresenta essas informações de forma automatizada e visual, operando globalmente e regionalmente (Brasil).

### 1.2 Perfil dos Usuários
O sistema foi projetado para:
- **Analistas de ESG e Sustentabilidade**: Profissionais corporativos que monitoram riscos climáticos.
- **Pesquisadores e Jornalistas de Dados**: Usuários que necessitam de acesso a dados históricos e geoespaciais formatados e cruzados.
- **Gestores Públicos**: Autoridades que utilizam o monitoramento para ações de defesa civil e saúde pública.

### 1.3 Escopo do Projeto

#### 1.3.1 O que ESTÁ no escopo (In-Scope)
- Extração automatizada diária de dados via APIs públicas (INPE, Open-Meteo, OpenWeather).
- Processamento e visualização de dados geoespaciais em nível Global e com **alta granularidade restrita ao Brasil**.
- Mapeamento analítico de qualidade do ar e correntes atmosféricas (Leaflet-Velocity).
- Filtros interativos por período de tempo e região geográfica.
- Exportação de relatórios avançados para fins acadêmicos.

#### 1.3.2 O que NÃO ESTÁ no escopo (Out-of-Scope)
- Processamento em tempo real absoluto (streaming). A atualização ocorre de forma quase real-time ou batch (dependendo da API externa).
- Alta granularidade de municípios no mundo inteiro (limitado a capitais no escopo global para manter a viabilidade arquitetural).
- Sistemas robustos de login/autenticação no MVP.

### 1.4 Requisitos do Sistema e Priorização

#### 1.4.1 Requisitos Funcionais (RF)
- **RF01 [Essencial]**: Ingestão de dados de focos de calor, clima e anomalias atmosféricas.
- **RF02 [Essencial]**: Exibição de mapas interativos de alto desempenho com milhares de marcadores geoespaciais renderizados via HTML5 Canvas.
- **RF03 [Essencial]**: Filtros analíticos contextuais.
- **RF04 [Desejável]**: Exportação dinâmica e geração de relatórios no Front-end.

#### 1.4.2 Requisitos Não Funcionais (RNF)
- **RNF01 [Desempenho]**: Mapas densos não devem "travar" ou engasgar a thread principal do navegador graças ao uso estrito de Memoização no React e renderização assíncrona.
- **RNF02 [Arquitetura]**: O pipeline de ingestão e ETL (Python) é totalmente desacoplado da aplicação web e do banco de dados (Star Schema).
- **RNF03 [Usabilidade]**: Design focado em "Aesthetics" e UX Premium (*Glassmorphism, Dark Mode*), distanciando-se de plataformas governamentais arcaicas.

<div style="page-break-after: always;"></div>

<h2 id="etapa-2">2. Etapa 2: Projeto (Design) do Sistema</h2>

Este capítulo consolida as escolhas arquiteturais refinadas, a modelagem de dados e a interface baseadas na abordagem API-Driven atualizada do projeto.

### 2.1 Escolha de Tecnologias Atualizadas
A stack foi montada sob a ótica de máxima performance em Big Data geoespacial:

- **Orquestração e Integração Contínua**: Ambiente dockerizado.
- **Data Warehouse**: PostgreSQL com **PostGIS 3.4**, adotando um Modelo Multidimensional (Star Schema) otimizado para agregações analíticas em milissegundos.
- **Back-end (API REST e ETL)**: Python 3.12 orquestrado via **FastAPI** para altíssima concorrência.
- **Front-end (Apresentação)**: Ecossistema React 19 em TypeScript e agrupado (*bundled*) com Vite. Utiliza **React-Leaflet** e `leaflet-velocity` para mapeamento fluido sobre Canvas.

### 2.2 Arquitetura do Sistema
O sistema é distribuído logicamente:
1. **Camada Externa (APIs)**: Fontes primárias de dados oficiais.
2. **Camada de Extração (ETL)**: Scripts Fast-Python processando lotes com regras de filtragem rigorosas de continentes e anomalias.
3. **Data Warehouse (Persistência)**: Fatos e Dimensões armazenados com suporte a cruzamentos radiais geoespaciais (PostGIS).
4. **Camada de Serviço (REST API)**: Exposição JSON de altíssimo throughput.
5. **Cliente Web (Interface)**: SPA altamente reativa e memoizada, oferecendo relatórios interativos.

<div style="page-break-after: always;"></div>

<h2 id="etapa-3">3. Atualização Arquitetural e Otimizações de Negócio</h2>

Recentemente, a arquitetura do AtmosMetrics recebeu atualizações drásticas que elevaram o projeto para o patamar corporativo/acadêmico ideal. 

### 3.1 Otimização Visual (Memoização e Renderização)
Anteriormente, o sistema sofria de engasgos na renderização de milhares de pontos no mapa do mundo. Foi implementado o padrão de `useMemo` com rastreio rígido de dependências nos componentes geoespaciais do React, o que permitiu estabilizar as renderizações na *Main Thread* do JS. Blocos informativos (*Bento Box UI*) e *Layouts* da página de Qualidade do Ar foram padronizados de forma moderna.

### 3.2 Regra de Negócio: Granularidade Desigual (Brasil x Mundo)
Um dos maiores desafios de modelagem e processamento resolvidos foi a gestão inteligente dos limites globais. O sistema adota duas lentes de captura no pipeline de ETL:
- **Lente Global (Mundo)**: Apenas capitais e grandes zonas geopolíticas são alimentadas. O custo transacional e de I/O de rede cai drasticamente.
- **Lente de Foco (Brasil)**: A malha nacional é povoada município a município de forma granular, proporcionando aos Analistas uma verdadeira exploração detalhada regional.

### 3.3 A Integridade de Modelagem
O uso rigoroso de um esquema dimensional (*Dimensões Temporais, Espaciais, de Satélite* para as respectivas *Fatos de Clima, Queimadas e Qualidade do Ar*) consolida a escalabilidade. O banco está programado e preparado para a ingestão de milhões de linhas, e a infraestrutura espelha essa segurança.
