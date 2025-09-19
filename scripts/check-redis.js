const Redis = require('redis');

async function checkApiKey() {
  const client = Redis.createClient({ 
    url: 'redis://default:X2SDaTYDK4tieNq246Cg3ZVPecSJND16@redis-17602.c62.us-east-1-4.ec2.redns.redis-cloud.com:17602'
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao Redis Cloud');

    const apiKey = 'eon_mfld7lf3_f15543eb3329795d1c787b550f28c32a64717b592287df3050d098f62f9e14eb';
    const cacheKey = `apikey:${apiKey}`;
    
    // Verificar se a chave existe
    const exists = await client.exists(cacheKey);
    console.log(`\n🔍 Chave existe no Redis: ${exists ? 'SIM' : 'NÃO'}`);
    
    if (exists) {
      const data = await client.get(cacheKey);
      
      try {
        const parsedData = JSON.parse(data);
        const apiKeyData = parsedData.data || parsedData; // Pode estar encapsulado
        
        console.log('\n📋 Dados da API Key:');
        console.log(`ID: ${apiKeyData.id || 'N/A'}`);
        console.log(`Nome: ${apiKeyData.name || 'N/A'}`);
        console.log(`Plan: ${apiKeyData.plan || 'N/A'}`);
        console.log(`Status: ${apiKeyData.status || 'N/A'}`);
        console.log(`Criada: ${apiKeyData.createdAt || 'N/A'}`);
        console.log(`Expira: ${apiKeyData.expiresAt || 'N/A'}`);
        console.log(`Última uso: ${apiKeyData.lastUsedAt || 'Nunca'}`);
        if (apiKeyData.usage) {
          console.log(`Uso Total: ${apiKeyData.usage.totalRequests || 0} requests`);
          console.log(`Uso Hoje: ${apiKeyData.usage.requestsToday || 0} requests`);
        }
        if (apiKeyData.rateLimit) {
          console.log(`Limite/dia: ${apiKeyData.rateLimit.requestsPerDay || 0} requests`);
        }
      } catch (parseError) {
        console.log('❌ Erro ao parsear JSON:', parseError.message);
      }
    }
    
    // Listar todas as chaves da API
    const allKeys = await client.keys('apikey:*');
    console.log(`\n📊 Total de API Keys no sistema: ${allKeys.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.quit();
  }
}

checkApiKey();