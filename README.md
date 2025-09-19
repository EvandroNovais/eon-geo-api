# EON GEO API - Geocodificação de CEPs Brasileiros

API RESTful robusta para geocodificação de CEPs brasileiros e cálculo de distâncias entre coordenadas geográficas.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Documentação](#documentação)
- [Testes](#testes)
- [Docker](#docker)
- [Configuração](#configuração)
- [Contribuição](#contribuição)
- [Licença](#licença)

## ✨ Características

- 🗺️ **Geocodificação de CEPs** brasileiros usando ViaCEP
- 📏 **Cálculo de distâncias** entre CEPs e coordenadas
- ⚡ **Cache Redis** para otimização de performance
- 🛡️ **Rate limiting** para prevenir abuso
- 📊 **Monitoramento** com health checks
- 📚 **Documentação Swagger** completa
- 🧪 **Testes automatizados** com alta cobertura
- 🐳 **Docker** pronto para produção
- 🔒 **Segurança** com Helmet.js
- 📝 **Logs estruturados** com Winston

## 🚀 Tecnologias

- **Node.js** 18+
- **TypeScript** 5.x
- **Express.js** 4.x
- **Redis** 7.x para cache
- **Joi** para validação
- **Axios** para chamadas HTTP
- **Winston** para logging
- **Jest** para testes
- **Swagger** para documentação
- **Docker** para containerização

## 📋 Pré-requisitos

- Node.js 18.0.0 ou superior
- Redis 6.0+ (para cache)
- npm ou yarn

## 🔧 Instalação

### Instalação Local

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/eon-geo-api.git
cd eon-geo-api
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**

**Opção A: Setup automático (recomendado)**
```bash
# Execute o script de configuração
./scripts/setup-env.sh
```

**Opção B: Setup manual**
```bash
# Para desenvolvimento local
cp .env.example .env

# Para Redis na nuvem (RedisLab, Railway, etc.)
cp .env.redislab.example .env
# Edite o .env com suas credenciais
```

**⚠️ IMPORTANTE**: 
- Nunca commite arquivos `.env` no Git
- Use `.env.example` para documentar variáveis necessárias
- Para Redis na nuvem, configure `REDIS_URL` com sua string de conexão completa

4. **Inicie o Redis:**
```bash
redis-server
```

5. **Execute a aplicação:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### Instalação com Docker

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/eon-geo-api.git
cd eon-geo-api
```

2. **Execute com Docker Compose:**
```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up

# Produção
docker-compose up
```

## 📖 Uso

A API estará disponível em `http://localhost:3000`

### Exemplos Rápidos

#### Geocodificar um CEP
```bash
curl http://localhost:3000/api/v1/geocoding/cep/01310-100
```

#### Calcular distância entre CEPs
```bash
curl -X POST http://localhost:3000/api/v1/distance/ceps \\
  -H "Content-Type: application/json" \\
  -d '{
    "originCep": "01310-100",
    "destinationCep": "20040-020"
  }'
```

#### Calcular distância entre coordenadas
```bash
curl -X POST http://localhost:3000/api/v1/distance/coordinates \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": {"latitude": -23.5613, "longitude": -46.6565},
    "destination": {"latitude": -22.9068, "longitude": -43.1729}
  }'
```

## 🛠️ API Endpoints

### Geocodificação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/geocoding/cep/{cep}` | Geocodifica um CEP |

### Cálculo de Distância

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/v1/distance/ceps` | Calcula distância entre CEPs |
| `POST` | `/api/v1/distance/coordinates` | Calcula distância entre coordenadas |

### Monitoramento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/health` | Status da aplicação |
| `GET` | `/` | Informações da API |

## 📚 Documentação

A documentação interativa da API está disponível via Swagger:

```
http://localhost:3000/api/docs
```

### Exemplos de Resposta

#### Geocodificação de CEP
```json
{
  "success": true,
  "data": {
    "coordinates": {
      "latitude": -23.5613,
      "longitude": -46.6565
    },
    "address": {
      "cep": "01310-100",
      "logradouro": "Avenida Paulista",
      "bairro": "Bela Vista",
      "localidade": "São Paulo",
      "uf": "SP"
    }
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### Cálculo de Distância
```json
{
  "success": true,
  "data": {
    "distance": {
      "kilometers": 357.42,
      "miles": 222.15
    },
    "origin": {
      "latitude": -23.5613,
      "longitude": -46.6565
    },
    "destination": {
      "latitude": -22.9068,
      "longitude": -43.1729
    }
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## 🧪 Testes

Execute os testes automatizados:

```bash
# Todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Cobertura de Testes

O projeto mantém cobertura mínima de 80% em:
- Linhas de código
- Funções
- Branches
- Statements

## 🐳 Docker

### Desenvolvimento
```bash
docker-compose -f docker-compose.dev.yml up
```

### Produção
```bash
docker-compose up
```

### Build Manual
```bash
# Build da imagem
docker build -t eon-geo-api .

# Executar container
docker run -p 3000:3000 eon-geo-api
```

## ⚙️ Configuração

### 🔧 Configuração do Redis

A aplicação suporta diferentes configurações de Redis:

#### **Redis Local (Desenvolvimento)**
```bash
# Docker Compose (recomendado)
docker-compose up redis

# Ou Redis local
redis-server
```

#### **Redis na Nuvem (Produção)**

**RedisLab/Redis Cloud:**
```bash
# No arquivo .env
REDIS_URL=redis://username:password@your-host.redislabs.com:port/database

# Ou configure individualmente:
REDIS_HOST=your-host.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=sua-senha
REDIS_USERNAME=default
REDIS_DATABASE=0
```

**Railway/Render/Heroku:**
```bash
# Use a variável de ambiente fornecida pela plataforma
REDIS_URL=$REDIS_URL
```

### 🔒 Segurança das Credenciais

- ✅ **Use `.env`** para configurações locais
- ✅ **Configure variáveis de ambiente** na plataforma de deploy
- ❌ **Nunca commite** arquivos `.env` no Git
- ✅ **Use `.env.example`** para documentar variáveis necessárias

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta do servidor | `3000` |
| `HOST` | Host do servidor | `localhost` |
| `REDIS_URL` | URL do Redis | `redis://localhost:6379` |
| `REDIS_TTL` | TTL do cache em segundos | `86400` |
| `RATE_LIMIT_WINDOW_MS` | Janela do rate limit | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests por janela | `100` |
| `LOG_LEVEL` | Nível de log | `info` |
| `OPENCAGE_API_KEY` | Chave da API OpenCage (opcional) | - |

### Rate Limiting

- **Geral**: 100 requests por 15 minutos
- **Geocodificação**: 30 requests por minuto
- **Distância**: 50 requests por minuto

### Cache

- **TTL padrão**: 24 horas
- **Estratégia**: Cache-aside
- **Invalidação**: Por TTL

## 📊 Monitoramento

### Health Check

O endpoint `/api/v1/health` retorna:
- Status da aplicação
- Uptime do servidor
- Status do Redis
- Status da API ViaCEP

### Logs

Logs estruturados em JSON com níveis:
- `error`: Erros críticos
- `warn`: Avisos importantes  
- `info`: Informações gerais
- `debug`: Informações de debug

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes

- Mantenha a cobertura de testes acima de 80%
- Siga os padrões do ESLint/Prettier
- Documente novas funcionalidades
- Atualize o README se necessário

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Executa em modo desenvolvimento |
| `npm run build` | Build para produção |
| `npm start` | Executa versão de produção |
| `npm test` | Executa testes |
| `npm run test:coverage` | Testes com cobertura |
| `npm run test:watch` | Testes em modo watch |
| `npm run lint` | Verifica código com ESLint |
| `npm run lint:fix` | Corrige problemas do ESLint |

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Documentação**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/api/v1/health`
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/eon-geo-api/issues)

---

Desenvolvido com ❤️ para geocodificação de CEPs brasileiros.# Updated Fri Sep 19 20:57:48 -03 2025
