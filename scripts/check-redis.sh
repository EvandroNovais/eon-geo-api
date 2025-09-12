#!/bin/bash

# Script para verificar conexão com Redis
# Execute: ./scripts/check-redis.sh

echo "🔍 Verificando conexão com Redis..."

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "💡 Execute: ./scripts/setup-env.sh"
    exit 1
fi

# Extrair REDIS_URL do arquivo .env
REDIS_URL=$(grep "^REDIS_URL=" .env | cut -d '=' -f2-)

if [ -z "$REDIS_URL" ]; then
    echo "❌ REDIS_URL não configurado no arquivo .env"
    exit 1
fi

echo "🔗 Tentando conectar ao Redis: $REDIS_URL"

# Verificar se redis-cli está disponível
if command -v redis-cli &> /dev/null; then
    echo "📡 Testando conexão com redis-cli..."
    
    # Extrair componentes da URL para teste
    if echo "$REDIS_URL" | grep -q "@"; then
        # URL com autenticação: redis://user:pass@host:port/db
        HOST_PORT=$(echo "$REDIS_URL" | sed 's/redis:\/\/[^@]*@//' | cut -d '/' -f1)
        HOST=$(echo "$HOST_PORT" | cut -d ':' -f1)
        PORT=$(echo "$HOST_PORT" | cut -d ':' -f2)
        
        # Testar ping
        if redis-cli -h "$HOST" -p "$PORT" ping > /dev/null 2>&1; then
            echo "✅ Redis está acessível!"
        else
            echo "⚠️  Não foi possível conectar com redis-cli (pode precisar de autenticação)"
        fi
    else
        # URL local: redis://localhost:6379
        if redis-cli ping > /dev/null 2>&1; then
            echo "✅ Redis local está funcionando!"
        else
            echo "❌ Redis local não está acessível"
            echo "💡 Execute: docker-compose up redis"
        fi
    fi
else
    echo "⚠️  redis-cli não está instalado, testando via aplicação..."
fi

# Testar via aplicação Node.js
echo "🚀 Testando conexão via aplicação..."

# Criar um teste rápido de conexão
cat > temp_redis_test.js << 'EOF'
const { createClient } = require('redis');
require('dotenv').config();

async function testRedis() {
    const client = createClient({ url: process.env.REDIS_URL });
    
    try {
        await client.connect();
        console.log('✅ Conexão com Redis estabelecida com sucesso!');
        
        // Teste básico de set/get
        await client.set('test_key', 'test_value');
        const value = await client.get('test_key');
        
        if (value === 'test_value') {
            console.log('✅ Operações de cache funcionando corretamente!');
        }
        
        await client.del('test_key');
        await client.disconnect();
        console.log('🔌 Conexão fechada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao conectar com Redis:', error.message);
        process.exit(1);
    }
}

testRedis();
EOF

# Executar o teste se Node.js estiver disponível
if command -v node &> /dev/null && [ -f "package.json" ]; then
    node temp_redis_test.js
    rm temp_redis_test.js
else
    echo "⚠️  Node.js não encontrado ou package.json não existe"
    rm temp_redis_test.js
fi

echo ""
echo "🏁 Verificação concluída!"