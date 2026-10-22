# desafio-isi-dev-1

# Sistema de Gestão de Liga (Passe)

Aplicação web completa para gestão de uma liga de futebol, englobando controle de clubes, elenco de jogadores, simulação tática e de partidas, além de classificação em tempo real.

---

## 1. Pré-requisitos
Para executar este projeto utilizando os runtimes oficiais e o Docker, certifique-se de ter instalado na sua máquina:
* **Node.js**: Versão `20.x` (com `npm`)
* **Docker** e **Docker Compose** (com suporte ao Ubuntu 24.04 / WSL2)

## 2. Banco de Dados

O banco de dados é executado em container Docker (MySQL 8.0) e gerenciado via migrations do **Knex.js**.

### Criar ou recriar o banco de dados do zero (a partir da pasta `backend`):
```bash
cd backend
npx knex migrate:rollback --all
npx knex migrate:latest
npm run dev
``` 

## 3. Passo a Passo para Execução (Ubuntu 24.04 / Docker)

Siga os comandos abaixo na ordem indicada, copiando-os diretamente para o terminal.

### Banco de Dados (na raiz do repositório)
```bash
docker compose up -d db
```

### Backend(Dentro da pasta Backend)
```bash
cd backend
cp .env.example .env
npm ci
npx knex migrate:latest
npm run dev
# API rodando em http://localhost:3000
```
### Frontend (em outro terminal, a partir da raiz do repositório)

```bash
cd frontend
cp .env.example .env  
npm ci
npm run dev
# Interface rodando em http://localhost:5173
```

## 4. Variáveis de Ambiente

O repositório contém arquivos .env.example tanto no diretório backend/ quanto no frontend/ para referência.

Exemplo backend/.env.example:
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASSWORD=userpassword
DB_NAME=liga_ficticia
```
Exemplo frontend/.env.example:
```
VITE_API_URL=http://localhost:3000
```

## 5. Estrutura de Pastas e Bibliotecas Utilizadas

Estrutura do Repositório:
```
.
├── backend/            # API REST (Node.js, Express, Knex, TypeScript)
├── frontend/           # Interface web (React, Vite, React Router, Lucide)
├── docker-compose.yml  # Orquestração dos serviços (MySQL, Backend, Frontend)
└── README.md
```
#### Bibliotecas do Backend:

- express: Framework web minimalista para construção das rotas e API REST.

- knex: Construtor de consultas SQL e gerenciador de migrações estruturadas.

- mysql2: Driver de conexão otimizado para o banco de dados MySQL.

- dotenv: Carregamento seguro de variáveis de ambiente a partir de arquivos .env.

- cors: Middleware para habilitar compartilhamento de recursos entre origens (CORS).

- tsx & typescript: Compilação e execução de TypeScript em tempo de desenvolvimento com suporte a hot-reload.

#### Bibliotecas do Frontend:

- react & react-dom: Biblioteca principal para construção de interfaces baseadas em componentes.

- react-router-dom: Gerenciamento de rotas e navegação de páginas no lado do cliente.

- axios: Cliente HTTP baseado em promessas para comunicação com o backend.

- lucide-react: Biblioteca de ícones vetoriais leves e modernos.

- vite: Ferramenta de build de alta performance e servidor de desenvolvimento frontend.

## 6. Decisões e Premissas

- Formações Táticas: O sistema valida se o clube possui exatamente 5 titulares selecionados (incluindo goleiro e distribuição baseada na formação escolhida) antes de habilitar a simulação da partida.

- Condição Física: Jogadores marcados com a condição DOENTE não podem ser escalados. Jogadores MAL_CONDICIONADO sofrem penalidade de 15% nos atributos durante a simulação dos duelos da partida.

- Desempate na Classificação: Os critérios oficiais adotados seguem rigorosamente a ordem: 
 1) Mais pontos, 
 2) Maior saldo de gols, 
 3) Mais gols marcados,
 4) Ordem alfabética do nome do clube.

 ## 7. Funcionalidades Não Implementadas

- Nenhuma funcionalidade obrigatória do escopo foi omitida; todas as telas de clubes, elenco, transações, partidas (com visualização tática de campo horizontal) e classificação encontram-se integralmente implementadas e funcionais.

## 8. Uso de Inteligência Artificial

Utilizei ferramentas de inteligência artificial generativa como suporte no desenvolvimento, estruturação de componentes visuais do campo tático, refinamento do design responsivo das páginas de classificação e suporte na configuração dos arquivos de orquestração com Docker Compose.
