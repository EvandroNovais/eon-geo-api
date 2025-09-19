// Este script simula exatamente como a aplicação se conecta ao Redis
const authService = require('../dist/services/auth.service').default;
const CacheService = require('../dist/services/cache.service').default;
const config = require('../dist/config').default;

// Simulate production environment
process.env.NODE_ENV = 'production';
process.env.REDIS_URL = 'redis://default:X2SDaTYDK4tieNq246Cg3ZVPecSJND16@redis-17602.c62.us-east-1-4.ec2.redns.redis-cloud.com:17602';

async function createApiKeyLikeProduction() {
  console.log('🚀 Simulando criação de API key como em produção...');
  console.log('Redis URL:', process.env.REDIS_URL);
  
  try {
    // Initialize cache service like the application does
    await CacheService.connect();
    console.log('✅ Conectado ao Redis usando CacheService');
    
    // Create API key using AuthService
    const apiKeyData = {
      name: 'Production Master Key',
      plan: 'premium',
      permissions: ['geocoding:read', 'distance:read']
    };
    
    console.log('🔑 Criando API key...');
    const result = await authService.createApiKey(apiKeyData);
    
    console.log('✅ API Key criada com sucesso!');
    console.log('🔑 API Key:', result.key);
    console.log('📋 Plano:', result.plan.name);
    console.log('📅 Expira em:', result.expiresAt);
    
    // Test the key
    console.log('\n🧪 Testando a API key...');
    const validation = await authService.validateApiKey(result.key);
    
    if (validation.valid) {
      console.log('✅ API Key validada com sucesso!');
      console.log('👤 Usuário:', validation.apiKey.name);
      console.log('🎯 Plano:', validation.apiKey.plan.name);
    } else {
      console.log('❌ Falha na validação da API key');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await CacheService.disconnect();
      console.log('🔌 Desconectado do Redis');
    } catch (e) {
      console.log('⚠️ Erro ao desconectar:', e.message);
    }
  }
}

createApiKeyLikeProduction();