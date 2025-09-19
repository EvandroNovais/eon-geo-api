const redis = require('redis');

async function testApiKey() {
  const client = redis.createClient({
    url: 'redis://default:gQCOTvJPzWGlGiQmKTvKcTYqTIFJyJQW@redis-17602.c62.us-east-1-4.ec2.redns.redis-cloud.com:17602'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao Redis Cloud');

    const apiKey = 'eon_mfld7lf3_f15543eb3329795d1c787b550f28c32a64717b592287df3050d098f62f9e14eb';
    const redisKey = `apikey:${apiKey}`;
    
    console.log(`\n🔍 Procurando chave: ${redisKey}`);
    
    const data = await client.get(redisKey);
    
    if (data) {
      console.log('✅ API Key encontrada no Redis!');
      const parsed = JSON.parse(data);
      console.log('\n📊 Dados da API Key:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Verificar status
      console.log(`\n📋 Status: ${parsed.status}`);
      console.log(`📅 Expira em: ${parsed.expiresAt}`);
      console.log(`📈 Uso atual: ${parsed.usage.requests}/${parsed.plan.limits.requestsPerDay} requests`);
      
      // Verificar se está expirada
      const now = new Date();
      const expiresAt = new Date(parsed.expiresAt);
      const isExpired = now > expiresAt;
      
      console.log(`\n⏰ Data atual: ${now.toISOString()}`);
      console.log(`⏰ Data de expiração: ${expiresAt.toISOString()}`);
      console.log(`${isExpired ? '❌' : '✅'} Expirada: ${isExpired}`);
      
    } else {
      console.log('❌ API Key NÃO encontrada no Redis!');
      
      // Vamos listar todas as chaves para debug
      console.log('\n🔍 Listando todas as chaves apikey:*');
      const keys = await client.keys('apikey:*');
      console.log('Chaves encontradas:', keys);
      
      if (keys.length > 0) {
        for (const key of keys) {
          const keyData = await client.get(key);
          console.log(`\n${key}:`, keyData);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.quit();
  }
}

testApiKey();