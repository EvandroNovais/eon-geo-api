#!/bin/bash

echo "🔧 Validando templates de configuração..."

# Templates que devem ser seguros
TEMPLATES=(
    ".env.example"
    ".env.production.example"
    ".env.redislab.example"
)

# Placeholders seguros esperados
SAFE_PLACEHOLDERS=(
    "YOUR_PASSWORD"
    "YOUR_API_KEY"
    "your-redis-host"
    "localhost"
    "127.0.0.1"
    "redis://localhost:6379"
)

# Patterns perigosos que NÃO devem estar em templates
DANGEROUS_PATTERNS=(
    "redis://default:[^@]{8,}@redis-[0-9]+"     # Redis real URLs
    "AIza[0-9A-Za-z_-]{35}"                     # Google API Keys reais
    "X2[A-Za-z0-9]{20,}"                        # Redis passwords reais
    "[0-9]{4,5}\.[a-z\-]+\.amazonaws\.com"      # AWS endpoints
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

errors=0

for template in "${TEMPLATES[@]}"; do
    if [[ ! -f "$template" ]]; then
        echo -e "${YELLOW}⚠️ Template não encontrado: $template${NC}"
        continue
    fi
    
    echo "📄 Validando: $template"
    
    # Verificar patterns perigosos
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        matches=$(grep -n -E "$pattern" "$template" 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            echo -e "${RED}❌ CREDENCIAL REAL detectada em $template:${NC}"
            echo -e "${YELLOW}$matches${NC}"
            errors=1
        fi
    done
    
    # Verificar se contém placeholders seguros
    has_safe_placeholder=false
    for placeholder in "${SAFE_PLACEHOLDERS[@]}"; do
        if grep -q "$placeholder" "$template" 2>/dev/null; then
            has_safe_placeholder=true
            break
        fi
    done
    
    if [[ "$has_safe_placeholder" == true ]]; then
        echo -e "${GREEN}✅ Template seguro: $template${NC}"
    else
        echo -e "${YELLOW}⚠️ Template sem placeholders seguros: $template${NC}"
    fi
done

if [[ $errors -eq 0 ]]; then
    echo -e "${GREEN}🎉 Todos os templates estão seguros!${NC}"
    exit 0
else
    echo -e "${RED}🚫 Falhas de segurança detectadas nos templates!${NC}"
    exit 1
fi