# Front-end: Dashboards Interativos

A camada de interface do usuário foi construída visando uma experiência *Premium*, distanciando-se de plataformas analíticas tradicionais pesadas, e abraçando um conceito estético moderno e responsivo.

---

## 🎨 Princípios Visuais e Tecnologias

Utilizamos o poder do ecossistema React para viabilizar painéis assíncronos e renderização de mapas de alta densidade sem bloqueios do navegador.

- **React 19 + TypeScript:** Arquitetura base. Componentização e checagem forte de tipos para evitar falhas em produção.
- **Vite:** *Bundler* de compilação ultrarrápida, provendo HMR (Hot Module Replacement) instantâneo durante o desenvolvimento.
- **Leaflet & React-Leaflet:** Ferramentas escolhidas para o Sistema de Informações Geográficas (GIS). Através da renderização via HTML5 Canvas (em vez de nós SVG do DOM convencional), suportamos centenas de marcadores simultâneos.
- **Leaflet-Velocity:** Plugin nativo JavaScript adaptado para mostrar a física de fluidos de massas de vento e correntes atmosféricas com um efeito translúcido global imersivo.
- **Recharts:** Gráficos interativos renderizados via SVG que expõem picos de calor e umidade globalmente.
- **CSS Flexível:** Todo o layout é orquestrado por CSS puramente *vanilla* utilizando Variáveis Nativas (`--bg-elevated`, `--glass-border`, etc.) formando um **Design System** que possibilita um *Dark Mode* contínuo com acabamento "Glassmorphism".

---

## 📂 Organização dos Módulos (Pages)

1. **DashboardPage (`/`):** Visão executiva primária. Mostra agregadores de clima e mapas dinâmicos globais com os maiores picos de temperaturas baseados na consulta de anomalias diárias no backend.
2. **QualidadeArPage (`/qualidade-ar`):** Representação do painel de AQI Global baseado nas premissas da EPA e modelagem inspirada em monitores visuais como o *IQAir*.
3. **FocosPage (`/focos`):** O rastreador das ondas e anomalias térmicas. Disponibiliza geração nativa assíncrona de relatórios geográficos formatados (CSV / PDF) para equipes acadêmicas.
4. **LocalidadesPage (`/localidades`):** Matriz e catálogo dos nós capturados no banco PostgreSQL globalmente agrupados por continente e bandeira correspondente à API do sistema.

---

## 🚀 Como Iniciar (Desenvolvimento Local)

Para realizar testes rápidos de Design e Fluxo:

1. Acesse o diretório:
   ```bash
   cd frontend
   ```
2. Instale todas as dependências (`node_modules`):
   ```bash
   npm install
   ```
3. Rode o servidor Vite local:
   ```bash
   npm run dev
   ```

O servidor local exporá a porta em `http://localhost:5173`. Quaisquer alterações no código TypeScript ou no CSS `.css` serão refletidas em tempo real.

> **⚠️ Atenção:** Para compilar para produção utilize `npm run build`. Note que a integração do `leaflet-velocity` ignora as verificações estritas do Typescript devido ao empacotamento legado do projeto original.
