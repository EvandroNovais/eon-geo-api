const Redis = require('redis');
const crypto = require('crypto');

// Configuração do Redis (usando as mesmas variáveis de ambiente)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

async function createProductionApiKey() {
  const client = Redis.createClient({ url: redisUrl });
  
  try {
    await client.connect();
    console.log('Connected to Redis');

    // Gerar uma API key
    const apiKey = 'eon_' + crypto.randomBytes(32).toString('hex');
    
    // Configurar os dados da API key
    const keyData = {
      id: crypto.randomUUID(),
      key: apiKey,
      name: 'Production API Key',
      description: 'API key for production use - created via script',
      plan: 'premium',
      permissions: ['geocoding:read', 'distance:read'],
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      usage: {
        totalRequests: 0,
        lastUsed: null
      }
    };

    // Salvar no Redis
    await client.setEx(`api_key:${apiKey}`, 86400 * 365, JSON.stringify(keyData)); // TTL de 1 ano
    
    console.log('\n🎉 API Key criada com sucesso!');
    console.log('================================');
    console.log(`API Key: ${apiKey}`);
    console.log(`Plan: ${keyData.plan}`);
    console.log(`Permissions: ${keyData.permissions.join(', ')}`);
    console.log(`Expires: ${keyData.expiresAt}`);
    console.log('\n📋 Use esta API key no Postman:');
    console.log(`Header: X-API-Key`);
    console.log(`Value: ${apiKey}`);
    console.log('\n⚠️  IMPORTANTE: Salve esta API key em local seguro!');
    
  } catch (error) {
    console.error('Erro ao criar API key:', error);
  } finally {
    await client.quit();
  }
}

createProductionApiKey();