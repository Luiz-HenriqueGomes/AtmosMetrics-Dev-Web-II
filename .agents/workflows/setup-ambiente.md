---
description: como configurar o ambiente de desenvolvimento do AtmosMetrics do zero em uma nova máquina
---

## Pré-requisitos

Antes de começar, certifique-se de que a máquina tem:
- Git instalado (https://git-scm.com/downloads)
- Docker Desktop instalado e rodando (https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe)

## Passos

1. Clone o repositório do GitHub:
```
git clone https://github.com/Luiz-HenriqueGomes/AtmosMetrics-Dev-Web-II.git AtmosMetrics
```

2. Acesse a pasta do projeto:
```
cd AtmosMetrics
```

3. Configure o Git com as credenciais do usuário:
```
git config --global user.name "Luiz-HenriqueGomes"
git config --global user.email "luiz12henrique21@gmail.com"
```

4. Crie o arquivo .env a partir do template:
```
copy .env.example .env
```

5. Verifique se o Docker Desktop está em execução (ícone de baleia na barra de tarefas deve estar verde/ativo).

6. Suba o banco de dados com Docker:
```
docker compose up -d
```

7. Aguarde ~30 segundos e verifique se o banco subiu corretamente:
```
docker compose ps
docker compose logs db
```

8. Verifique as tabelas criadas conectando ao banco:
```
docker compose exec db psql -U atmos_user -d atmosmetrics -c "\dt"
```

O resultado deve mostrar as 4 tabelas: dim_tempo, dim_satelite, dim_localidade, fato_anomalia_termica.

## Verificação Final

Se tudo correu bem, você verá:
- Container `atmosmetrics_db` com status `healthy`
- 4 tabelas listadas no psql
- dim_satelite com 13 registros (satélites do INPE)
- dim_localidade com 27 registros (estados brasileiros)

## Próximos Passos

Após o setup, continuar pela Fase 2: ETL para ingestão de dados do INPE.
