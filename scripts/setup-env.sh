#!/bin/bash

# Script para configuração inicial do ambiente
# Execute: ./scripts/setup-env.sh

echo "🔧 Configurando ambiente da EON GEO API..."

# Verificar se o arquivo .env já existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe. Fazendo backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Perguntar qual tipo de ambiente configurar
echo ""
echo "Selecione o tipo de ambiente:"
echo "1) Desenvolvimento local (Redis local/Docker)"
echo "2) Redis na nuvem (RedisLab, Railway, etc.)"
echo ""
read -p "Digite sua escolha (1 ou 2): " choice

case $choice in
    1)
        echo "📋 Copiando configuração para desenvolvimento local..."
        cp .env.example .env
        echo "✅ Arquivo .env criado com configuração local"
        echo "🐳 Para usar Redis local, execute: docker-compose up redis"
        ;;
    2)
        echo "☁️  Copiando template para Redis na nuvem..."
        cp .env.redislab.example .env
        echo "✅ Arquivo .env criado com template para Redis na nuvem"
        echo ""
        echo "🔧 IMPORTANTE: Edite o arquivo .env e configure:"
        echo "   - REDIS_URL com sua string de conexão do RedisLab"
        echo "   - Ou configure REDIS_HOST, REDIS_PORT, REDIS_PASSWORD individualmente"
        echo ""
        echo "💡 Exemplo de REDIS_URL:"
        echo "   redis://username:password@your-host.redislabs.com:port/database"
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "📝 Próximos passos:"
echo "   1. Edite o arquivo .env com suas configurações"
echo "   2. Execute: npm install"
echo "   3. Execute: npm run dev"
echo ""
echo "🔒 LEMBRE-SE: Nunca commite o arquivo .env no Git!"
echo "✅ Setup concluído!"