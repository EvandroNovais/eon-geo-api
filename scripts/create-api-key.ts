import authService from '../src/services/auth.service';
import { ApiKeyPlan, ApiPermission } from '../src/types/auth.types';

async function createProductionApiKey() {
  try {
    console.log('Creating production API key...');
    
    // Create a premium API key
    const result = await authService.createApiKey({
      name: 'Production API Key',
      description: 'API key for production applications',
      plan: ApiKeyPlan.PREMIUM,
      permissions: [ApiPermission.GEOCODING_READ, ApiPermission.DISTANCE_READ],
      expiresInDays: 365
    });

    console.log('\n🎉 API Key criada com sucesso!');
    console.log('================================');
    console.log(`ID: ${result.id}`);
    console.log(`API Key: ${result.key}`);
    console.log(`Plan: ${result.plan}`);
    console.log(`Permissions: ${result.permissions.join(', ')}`);
    console.log(`Created: ${result.createdAt}`);
    console.log(`Expires: ${result.expiresAt || 'Never'}`);
    console.log('\n📋 Use esta API key no Postman:');
    console.log(`Header: X-API-Key`);
    console.log(`Value: ${result.key}`);
    console.log('\n⚠️  IMPORTANTE: Salve esta API key em local seguro!');
    console.log('\n🧪 Teste agora:');
    console.log(`curl -X GET "https://geo-api.eontecnologia.com/api/v1/geocoding/cep/01310-100" \\`);
    console.log(`  -H "X-API-Key: ${result.key}" \\`);
    console.log(`  -H "Accept: application/json"`);
    
  } catch (error) {
    console.error('Erro ao criar API key:', error);
  }
}

createProductionApiKey();