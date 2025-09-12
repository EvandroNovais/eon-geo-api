#!/bin/bash

# Script para verificar conexão com Redis

echo "🔍 Verificando conexão com Redis..."

# Verifica se o .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Execute ./scripts/setup-env.sh primeiro"
    exit 1
fi

# Carrega variáveis do .env
source .env

echo "📝 Configuração detectada:"
echo "   REDIS_URL: ${REDIS_URL:0:20}..."

# Teste de conexão Node.js
echo ""
echo "🔗 Testando conexão com Redis..."

node -e "
const redis = require('redis');
const url = process.env.REDIS_URL;

async function testConnection() {
    try {
        console.log('⏳ Conectando ao Redis...');
        const client = redis.createClient({
            url: url,
            socket: {
                connectTimeout: 5000,
                commandTimeout: 3000
            },
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: null
        });

        client.on('error', (err) => {
            console.log('❌ Erro de conexão:', err.message);
        });

        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Teste básico
        await client.set('test:connection', 'ok', { EX: 10 });
        const result = await client.get('test:connection');
        
        if (result === 'ok') {
            console.log('✅ Teste de leitura/escrita OK!');
        } else {
            console.log('⚠️  Problema no teste de leitura/escrita');
        }
        
        await client.del('test:connection');
        await client.disconnect();
        console.log('🎉 Redis configurado corretamente!');
        
    } catch (error) {
        console.log('❌ Erro na conexão:', error.message);
        process.exit(1);
    }
}

testConnection();
"