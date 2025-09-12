# 🧪 Testing Guide - EON GEO API

## 🚀 Quick Start

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Application will be running at:**
   - 🌐 **API Base**: http://localhost:3000
   - 📚 **Documentation**: http://localhost:3000/api/docs
   - 🏥 **Health Check**: http://localhost:3000/api/v1/health

## 📍 API Endpoints

### Health Check
```
GET /api/v1/health
```

### Geocoding
```
GET /api/v1/geocoding/cep/{cep}
```

**Examples:**
- ✅ `GET /api/v1/geocoding/cep/01310-100` (Av. Paulista, SP)
- ✅ `GET /api/v1/geocoding/cep/09812-620` (São Bernardo do Campo, SP)
- ✅ `GET /api/v1/geocoding/cep/20040-020` (Centro, Rio de Janeiro, RJ)
- ✅ `GET /api/v1/geocoding/cep/47590-000` (Ipupiara, BA)

### Distance Calculation
```
POST /api/v1/distance/ceps
Content-Type: application/json

{
  "originCep": "01310-100",
  "destinationCep": "20040-020"
}
```

```
POST /api/v1/distance/coordinates
Content-Type: application/json

{
  "origin": {
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "destination": {
    "latitude": -22.9068,
    "longitude": -43.1729
  }
}
```

## 🔧 Postman Configuration

1. **Import Collection**: `postman_collection.json`
2. **Import Environment**: `postman_environment.json`
3. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:3000`

## ⚠️ Common Issues

### ❌ Wrong URL Format:
```
/api/v1/api/v1/geocoding/cep/... ← WRONG (duplicated path)
```

### ✅ Correct URL Format:
```
/api/v1/geocoding/cep/... ← CORRECT
```

## 🧪 Test Commands

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Geocoding examples
curl http://localhost:3000/api/v1/geocoding/cep/01310-100
curl http://localhost:3000/api/v1/geocoding/cep/09812-620

# Distance between CEPs
curl -X POST http://localhost:3000/api/v1/distance/ceps \
  -H "Content-Type: application/json" \
  -d '{"originCep":"01310-100","destinationCep":"20040-020"}'
```

## 📝 Expected Response Format

```json
{
  "success": true,
  "data": {
    "coordinates": {
      "latitude": -23.588912,
      "longitude": -46.674042
    },
    "address": {
      "cep": "09812-620",
      "logradouro": "Rua Alfa",
      "bairro": "Assunção",
      "localidade": "São Bernardo do Campo",
      "uf": "SP",
      "ibge": "3548708",
      "ddd": "11"
    }
  },
  "timestamp": "2025-09-12T01:01:51.966Z"
}
```