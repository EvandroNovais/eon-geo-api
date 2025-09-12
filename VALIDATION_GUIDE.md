# 🔍 Guia de Validação - EON GEO API

## 📊 Status Atual da API
**URL**: https://geo-api.eontecnologia.com  
**Status**: ❌ **503 Service Unavailable** (Aplicação não está rodando)

## 🩺 Diagnóstico Rápido

### 1. **Verificar Status da Aplicação no Coolify**
```bash
# No painel do Coolify, verifique:
1. Status do container: Deve estar "Running" 
2. Logs da aplicação: Procure por erros
3. Health checks: Devem estar passando
4. Port mapping: Deve estar 3000:3000
```

### 2. **Comandos de Teste quando a API estiver funcionando**

#### ✅ Health Check
```bash
curl "https://geo-api.eontecnologia.com/api/v1/health"
```
**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-12T13:34:22.000Z",
  "uptime": 3600,
  "services": {
    "redis": "connected",
    "viaCep": "available"
  }
}
```

#### ✅ Informações da API
```bash
curl "https://geo-api.eontecnologia.com/"
```
**Resposta esperada:**
```json
{
  "name": "EON GEO API",
  "version": "1.0.0",
  "description": "API RESTful robusta para geocodificação de CEPs brasileiros",
  "endpoints": {
    "health": "/api/v1/health",
    "docs": "/api/docs",
    "geocoding": "/api/v1/geocoding/cep/{cep}",
    "distance": "/api/v1/distance"
  }
}
```

#### ✅ Documentação Swagger
```bash
# Acesse no browser:
https://geo-api.eontecnologia.com/api/docs
```

#### ✅ Teste de Geocodificação
```bash
# CEP da Avenida Paulista
curl "https://geo-api.eontecnologia.com/api/v1/geocoding/cep/01310-100"

# CEP de São Bernardo do Campo
curl "https://geo-api.eontecnologia.com/api/v1/geocoding/cep/09812-620"

# CEP do Rio de Janeiro
curl "https://geo-api.eontecnologia.com/api/v1/geocoding/cep/20040-020"
```

#### ✅ Teste de Distância entre CEPs
```bash
curl -X POST "https://geo-api.eontecnologia.com/api/v1/distance/ceps" \
  -H "Content-Type: application/json" \
  -d '{
    "originCep": "01310-100",
    "destinationCep": "20040-020"
  }'
```

#### ✅ Teste de Distância entre Coordenadas
```bash
curl -X POST "https://geo-api.eontecnologia.com/api/v1/distance/coordinates" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "destination": {
      "latitude": -22.9068,
      "longitude": -43.1729
    }
  }'
```

## 🔧 Troubleshooting

### Problema: HTTP 503 (Service Unavailable)

#### **Verificações no Coolify:**

1. **Status do Container**
   ```
   - Vá para o painel do Coolify
   - Verifique se o status está "Running"
   - Se não estiver, clique em "Start" ou "Deploy"
   ```

2. **Logs da Aplicação**
   ```
   - Acesse "Logs" no painel do Coolify
   - Procure por erros como:
     * Falha na conexão com Redis
     * Erro de porta (PORT binding)
     * Erro de ambiente (ENV vars)
   ```

3. **Variáveis de Ambiente**
   ```bash
   # Verifique se estas variáveis estão configuradas:
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   REDIS_URL=redis://default:X2SDaTYDK4tieNq246Cg3ZVPecSJND16@redis-17602.c62.us-east-1-4.ec2.redns.redis-cloud.com:17602
   ```

4. **Health Check Configuration**
   ```bash
   # No Coolify, configure:
   Health Check Path: /api/v1/health
   Health Check Port: 3000
   Health Check Interval: 30s
   ```

### **Possíveis Soluções:**

1. **Reiniciar a Aplicação**
   - No Coolify: Stop → Start
   - Ou faça um novo Deploy

2. **Verificar Redis**
   - Teste se o Redis está acessível
   - Verifique se a URL do Redis está correta

3. **Verificar Logs**
   - Procure por erros de inicialização
   - Verifique se a porta 3000 está sendo usada

## 📱 Teste Manual no Browser

Quando a API estiver funcionando, acesse:

1. **Documentação**: https://geo-api.eontecnologia.com/api/docs
2. **Health Check**: https://geo-api.eontecnologia.com/api/v1/health  
3. **Teste de CEP**: https://geo-api.eontecnologia.com/api/v1/geocoding/cep/01310-100

## 🎯 Checklist de Validação

Marque quando cada teste passar:

- [ ] Health check retorna 200 OK
- [ ] Documentação Swagger carrega
- [ ] Geocodificação de CEP funciona
- [ ] Cálculo de distância funciona
- [ ] Redis está conectado
- [ ] Rate limiting está ativo
- [ ] CORS está configurado
- [ ] Headers de segurança presentes

## 📞 Próximos Passos

1. **Verificar status no Coolify**
2. **Revisar logs de erro**
3. **Confirmar variáveis de ambiente**
4. **Testar conexão Redis**
5. **Executar testes quando funcionando**