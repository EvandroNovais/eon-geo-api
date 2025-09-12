# Prompt para Criação de API de Geocodificação de CEPs

## Objetivo
Criar uma API RESTful robusta para geocodificação de CEPs brasileiros e cálculo de distâncias entre coordenadas geográficas.

## Requisitos Funcionais

### 1. Geocodificação de CEP
- **Endpoint**: `GET /api/v1/geocoding/cep/{cep}`
- **Funcionalidade**: Converter CEP em coordenadas geográficas (latitude/longitude)
- **Validação**: CEP deve seguir formato brasileiro (8 dígitos, com ou sem hífen)
- **Resposta**: Retornar latitude, longitude, endereço completo, cidade, estado

### 2. Cálculo de Distância entre CEPs
- **Endpoint**: `POST /api/v1/distance/ceps`
- **Funcionalidade**: Calcular distância entre dois CEPs
- **Entrada**: JSON com dois CEPs de origem e destino
- **Cálculo**: Usar fórmula de Haversine para distância geodésica
- **Resposta**: Distância em quilômetros e milhas

### 3. Cálculo de Distância entre Coordenadas
- **Endpoint**: `POST /api/v1/distance/coordinates`
- **Funcionalidade**: Calcular distância entre coordenadas geográficas
- **Entrada**: JSON com latitude/longitude de origem e destino

## Especificações Técnicas

### Tecnologia Recomendada: Node.js
- **Framework**: Express.js ou Fastify
- **Linguagem**: TypeScript para maior robustez
- **Validação**: Joi ou Yup para validação de entrada
- **HTTP Client**: Axios para chamadas externas

### APIs Externas Sugeridas
- **ViaCEP**: API gratuita brasileira para dados de CEP
- **OpenCage Geocoder**: Para geocodificação complementar
- **Alternativa**: Google Maps Geocoding API (requer chave)

### Nível de Maturidade Richardson: Nível 2
- **HTTP Verbs**: Uso correto de GET e POST
- **Recursos**: URLs bem estruturadas representando recursos
- **Status Codes**: Códigos HTTP apropriados para cada situação
- **Content Negotiation**: Suporte a JSON

## Estrutura da API

### Endpoints Principais

```
GET /api/v1/geocoding/cep/{cep}
POST /api/v1/distance/ceps
POST /api/v1/distance/coordinates
GET /api/v1/health
```

### Responses Padronizadas

#### Sucesso (200)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

#### Erro (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CEP",
    "message": "CEP format is invalid",
    "details": "CEP must contain 8 digits"
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Melhores Práticas Obrigatórias

### 1. Tratamento de Erros
- Middleware global de tratamento de erros
- Validação de entrada rigorosa
- Logs estruturados (Winston ou similar)
- Rate limiting para prevenir abuso

### 2. Performance e Cache
- Cache em memória (Redis) para CEPs já consultados
- TTL de 24 horas para dados de geocodificação
- Compressão gzip/deflate
- Headers de cache HTTP apropriados

### 3. Segurança
- Helmet.js para headers de segurança
- CORS configurado adequadamente
- Validação e sanitização de entrada
- Rate limiting por IP

### 4. Documentação
- Swagger/OpenAPI 3.0 completo
- Exemplos de requisição/resposta
- Códigos de erro documentados
- README.md detalhado

### 5. Testes
- Testes unitários (Jest)
- Testes de integração
- Cobertura mínima de 80%
- Mocks para APIs externas

### 6. Monitoramento
- Health check endpoint
- Métricas de performance
- Logging estruturado
- Status de APIs externas

## Estrutura do Projeto

```
src/
├── controllers/
│   ├── geocoding.controller.ts
│   └── distance.controller.ts
├── services/
│   ├── geocoding.service.ts
│   ├── distance.service.ts
│   └── cache.service.ts
├── middleware/
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   └── rateLimit.middleware.ts
├── utils/
│   ├── haversine.util.ts
│   └── cep.util.ts
├── types/
│   └── api.types.ts
├── config/
│   └── index.ts
├── routes/
│   └── index.ts
└── app.ts
```

## Especificação Swagger

### Inclua no Swagger:
- Título: "API de Geocodificação de CEPs"
- Versão: "1.0.0"
- Descrição detalhada de cada endpoint
- Modelos de dados (schemas)
- Exemplos de requests/responses
- Códigos de status HTTP
- Autenticação (se aplicável)

## Validações Específicas

### CEP
- Formato: 8 dígitos numéricos
- Aceitar com ou sem hífen
- Remover caracteres especiais
- Validar existência via API externa

### Coordenadas
- Latitude: -90 a +90
- Longitude: -180 a +180
- Precisão: até 6 casas decimais

### Distância
- Retornar em quilômetros (padrão) e milhas
- Arredondar para 2 casas decimais
- Validar se coordenadas são válidas

## Extras Desejáveis

### 1. Funcionalidades Avançadas
- Busca por endereço (geocodificação reversa)
- Múltiplos CEPs em uma requisição
- Histórico de consultas
- Cache inteligente

### 2. Deploy e DevOps
- Dockerfile para containerização
- docker-compose para desenvolvimento
- Variáveis de ambiente para configuração
- CI/CD básico (GitHub Actions)

### 3. Performance
- Otimização de consultas
- Pool de conexões
- Graceful shutdown
- Circuit breaker para APIs externas

## Deliverables

1. **Código fonte completo** com TypeScript
2. **Documentação Swagger** acessível via `/api/docs`
3. **README.md** com instruções de instalação e uso
4. **Testes automatizados** com cobertura
5. **Dockerfile** e docker-compose
6. **Collection Postman** para testes manuais

## Critérios de Aceitação

- [ ] API funcional com todos os endpoints especificados
- [ ] Documentação Swagger completa e navegável
- [ ] Tratamento adequado de erros e validações
- [ ] Cache implementado e funcional
- [ ] Testes com cobertura mínima de 80%
- [ ] Performance adequada (< 500ms por requisição)
- [ ] Code review friendly (código limpo e bem documentado)

## Observações Importantes

- Considere limites de rate das APIs externas
- Implemente fallbacks para quando APIs externas estiverem indisponíveis
- Use TypeScript para maior robustez do código
- Priorize legibilidade e manutenibilidade do código
- Documente decisões arquiteturais importantes