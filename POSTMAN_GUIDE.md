# EON GEO API - Postman Collection

## Configuração

1. Importe esta collection no Postman
2. Configure a variável de ambiente `baseUrl` para `http://localhost:3000`

## Requests Disponíveis

### Health Check
- **GET** `{{baseUrl}}/api/v1/health` - Verifica status da aplicação
- **GET** `{{baseUrl}}/` - Informações da API

### Geocodificação
- **GET** `{{baseUrl}}/api/v1/geocoding/cep/01310-100` - CEP São Paulo
- **GET** `{{baseUrl}}/api/v1/geocoding/cep/20040020` - CEP Rio (sem hífen)
- **GET** `{{baseUrl}}/api/v1/geocoding/cep/70040-010` - CEP Brasília

### Cálculo de Distância

#### Entre CEPs
```
POST {{baseUrl}}/api/v1/distance/ceps
Content-Type: application/json

{
  "originCep": "01310-100",
  "destinationCep": "20040-020"
}
```

#### Entre Coordenadas
```
POST {{baseUrl}}/api/v1/distance/coordinates
Content-Type: application/json

{
  "origin": {
    "latitude": -23.5613,
    "longitude": -46.6565
  },
  "destination": {
    "latitude": -22.9068,
    "longitude": -43.1729
  }
}
```

## Testes de Erro

### CEP Inválido
- **GET** `{{baseUrl}}/api/v1/geocoding/cep/123` - Deve retornar 400

### Coordenadas Inválidas
```
POST {{baseUrl}}/api/v1/distance/coordinates
Content-Type: application/json

{
  "origin": {
    "latitude": -91,
    "longitude": -46.6565
  },
  "destination": {
    "latitude": -22.9068,
    "longitude": -43.1729
  }
}
```

### Endpoint Inexistente
- **GET** `{{baseUrl}}/api/v1/invalid` - Deve retornar 404