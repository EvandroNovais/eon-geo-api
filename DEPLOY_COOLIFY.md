# 🚀 Deploy no Coolify - EON GEO API

## 📋 Pré-requisitos

1. **Redis Cloud**: Tenha uma instância Redis disponível (você já tem configurada)
2. **Coolify**: Conta e projeto configurado
3. **Repositório Git**: Código sincronizado no GitHub

## ⚙️ Configuração no Coolify

### 1. **Criar Nova Aplicação**
- Tipo: **Docker**
- Source: **GitHub Repository** (`EvandroNovais/eon-geo-api`)
- Branch: **main**

### 2. **Variáveis de Ambiente** 
Configure as seguintes variáveis no Coolify:

```bash
# OBRIGATÓRIAS
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
REDIS_URL=redis://default:X2SDaTYDK4tieNq246Cg3ZVPecSJND16@redis-17602.c62.us-east-1-4.ec2.redns.redis-cloud.com:17602

# OPCIONAIS (com valores padrão seguros)
REDIS_TTL=86400
REDIS_CONNECTION_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
CACHE_TTL_SECONDS=86400
```

### 3. **Configurações de Deploy**
- **Build Command**: `npm run build:prod`
- **Start Command**: `npm run start:prod`
- **Port**: `3000`
- **Health Check Path**: `/api/v1/health`

### 4. **Dockerfile**
O projeto já possui um Dockerfile otimizado que:
- ✅ Multi-stage build para imagem menor
- ✅ Usuário não-root para segurança
- ✅ Health check integrado
- ✅ Variáveis de ambiente de produção

## 🔍 Health Checks

A aplicação expõe um endpoint de saúde em:
```
GET /api/v1/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-12T01:00:00.000Z",
  "uptime": 3600,
  "services": {
    "redis": "connected",
    "viaCep": "available"
  }
}
```

## 📡 Endpoints da API

Após o deploy, sua API estará disponível em:

### Base URLs
- **Health**: `https://your-app.coolify.domain/api/v1/health`
- **Docs**: `https://your-app.coolify.domain/api/docs`

### Principais Endpoints
```bash
# Geocodificação
GET /api/v1/geocoding/cep/{cep}

# Distância entre CEPs
POST /api/v1/distance/ceps
{
  "originCep": "01310-100",
  "destinationCep": "20040-020"
}

# Distância entre coordenadas
POST /api/v1/distance/coordinates
{
  "origin": {"latitude": -23.5505, "longitude": -46.6333},
  "destination": {"latitude": -22.9068, "longitude": -43.1729}
}
```

## 🔒 Segurança

A aplicação já vem com:
- ✅ **Helmet.js**: Headers de segurança
- ✅ **CORS**: Configurado para produção
- ✅ **Rate Limiting**: Proteção contra spam
- ✅ **Input Validation**: Joi para validação
- ✅ **Error Handling**: Respostas padronizadas
- ✅ **Health Monitoring**: Monitoramento de serviços

## 🚨 Troubleshooting

### Build Failures
```bash
# ✅ RESOLVED: package-lock.json issue
# The project now includes package-lock.json in Docker build context
# This ensures reproducible builds with exact dependency versions

# If build still fails, verify:
1. Node.js versão >= 18.0.0
2. package-lock.json is present in repository
3. npm ci runs successfully
4. TypeScript compiles without errors
```

### Connection Issues
```bash
# Se a conexão falhar:
1. Verifique se REDIS_URL está correto
2. Teste conectividade com Redis
3. Verifique logs da aplicação
```

### Health Check Failures
```bash
# Se health check falhar:
1. Verifique se a porta 3000 está exposta
2. Confirme que /api/v1/health responde
3. Verifique logs de erro
```

## 📊 Monitoramento

Use os seguintes endpoints para monitoramento:

```bash
# Status geral
curl https://your-app.coolify.domain/api/v1/health

# Teste de funcionalidade
curl https://your-app.coolify.domain/api/v1/geocoding/cep/01310-100

# Documentação
curl https://your-app.coolify.domain/api/docs
```

## 🔄 Deploy Automático

O Coolify detectará mudanças no repositório automaticamente. Para force deploy:
1. Acesse o painel do Coolify
2. Vá para sua aplicação
3. Clique em "Deploy"

## 📞 Support

Se encontrar problemas:
1. Verifique logs no painel do Coolify
2. Teste endpoints localmente primeiro
3. Confirme configurações de ambiente