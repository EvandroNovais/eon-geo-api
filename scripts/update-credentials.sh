#!/bin/bash

# Script para atualização segura de credenciais
# Este script NUNCA deve conter credenciais reais

echo "🔐 Atualizador Seguro de Credenciais"
echo "===================================="

# Verificar se as novas credenciais foram fornecidas como argumentos
if [[ $# -ne 2 ]]; then
    echo "❌ Uso correto:"
    echo "$0 <nova_redis_url> <nova_google_api_key>"
    echo ""
    echo "Exemplo:"
    echo "$0 'redis://default:NEW_PASS@redis-host:port' 'AIza...'"
    exit 1
fi

NEW_REDIS_URL="$1"
NEW_GOOGLE_API_KEY="$2"

# Validar formato das credenciais
if [[ ! "$NEW_REDIS_URL" =~ ^redis://default:[^@]+@redis-[0-9]+\. ]]; then
    echo "❌ Formato inválido da URL Redis"
    exit 1
fi

if [[ ! "$NEW_GOOGLE_API_KEY" =~ ^AIza[0-9A-Za-z_-]{35}$ ]]; then
    echo "❌ Formato inválido da API Key Google"
    exit 1
fi

# Criar .env local seguro (nunca commitado)
cat > .env << EOF
# Environment
NODE_ENV=development

# Server
PORT=3000
HOST=localhost

# Redis Cloud (NUNCA COMMITAR ESTE ARQUIVO)
REDIS_URL=$NEW_REDIS_URL
REDIS_TTL=86400
REDIS_CONNECTION_TIMEOUT=5000
REDIS_COMMAND_TIMEOUT=3000

# API Keys (NUNCA COMMITAR ESTE ARQUIVO)
GOOGLE_MAPS_API_KEY=$NEW_GOOGLE_API_KEY

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=

# Cache
CACHE_TTL_SECONDS=86400
EOF

echo "✅ Arquivo .env local criado"

# Gerar script para produção (sem credenciais expostas)
cat > scripts/update-production-env.txt << EOF
# Instruções para atualizar produção via Coolify:

1. Acesse o painel do Coolify
2. Vá para o projeto eon-geo-api
3. Clique em Environment Variables
4. Atualize as seguintes variáveis:

REDIS_URL=$NEW_REDIS_URL
GOOGLE_MAPS_API_KEY=$NEW_GOOGLE_API_KEY

5. Salve e faça redeploy da aplicação
6. DELETE este arquivo após usar!
EOF

echo "✅ Instruções de produção geradas em scripts/update-production-env.txt"
echo "⚠️  IMPORTANTE: Delete o arquivo de instruções após usar!"

# Testar conectividade
echo "🧪 Testando conectividade..."

# Teste Redis (sem expor credenciais no output)
node -e "
const redis = require('redis');
const client = redis.createClient({url: '$NEW_REDIS_URL'});
client.connect()
  .then(() => {
    console.log('✅ Redis: Conectado com sucesso');
    return client.quit();
  })
  .catch(err => {
    console.log('❌ Redis: Falha na conexão');
    process.exit(1);
  });
"

# Teste Google Maps API
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://maps.googleapis.com/maps/api/geocode/json?address=test&key=$NEW_GOOGLE_API_KEY")

if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ Google Maps API: Funcionando"
else
    echo "❌ Google Maps API: Falha (HTTP $HTTP_STATUS)"
fi

echo ""
echo "🎉 Atualização concluída!"
echo "📋 Próximos passos:"
echo "1. Testar a aplicação localmente"
echo "2. Atualizar variáveis no Coolify usando as instruções geradas"
echo "3. Fazer redeploy da produção"
echo "4. DELETAR o arquivo scripts/update-production-env.txt"