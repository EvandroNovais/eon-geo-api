# 🔐 Guia de Segurança - EON GEO API

## 🚨 NUNCA COMMITE CREDENCIAIS REAIS!

### ✅ **O que é SEGURO commitar:**
- Arquivos `.env.example` com placeholders
- Scripts sem credenciais hardcoded
- Documentação de configuração
- Templates com `YOUR_PASSWORD`, `localhost`, etc.

### ❌ **O que NUNCA commitar:**
- Arquivos `.env` com credenciais reais
- URLs Redis com senhas reais
- API keys do Google Maps
- Qualquer senha ou token real
- Backups de arquivos `.env`

## 🛡️ **Sistema de Proteção Implementado**

### 1. **Pre-commit Hook**
- **Localização**: `.githooks/pre-commit`
- **Função**: Bloqueia commits com credenciais
- **Ativação**: `git config core.hooksPath .githooks`

### 2. **GitHub Actions**
- **Arquivo**: `.github/workflows/security.yml`
- **Função**: Escaneia credenciais em PRs e pushes
- **Ferramenta**: TruffleHog + patterns customizados

### 3. **Validação de Templates**
- **Script**: `scripts/validate-templates.sh`
- **Função**: Verifica se templates estão seguros
- **Uso**: `./scripts/validate-templates.sh`

### 4. **Atualização Segura**
- **Script**: `scripts/update-credentials.sh`
- **Função**: Atualiza credenciais sem exposição
- **Uso**: `./scripts/update-credentials.sh <redis_url> <google_key>`

## 🔄 **Processo de Atualização de Credenciais**

### Quando receber novas credenciais:

```bash
# 1. Execute o script de atualização
./scripts/update-credentials.sh "redis://..." "AIza..."

# 2. Teste localmente
npm run dev

# 3. Atualize produção via Coolify
# (use as instruções geradas em scripts/update-production-env.txt)

# 4. Delete o arquivo de instruções
rm scripts/update-production-env.txt
```

## 🧪 **Testando o Sistema de Proteção**

```bash
# Validar templates
./scripts/validate-templates.sh

# Testar hook de pre-commit (deve falhar)
echo "REDIS_URL=redis://default:real_password@host" > test.env
git add test.env
git commit -m "test"  # Deve ser bloqueado

# Limpar teste
rm test.env
git reset
```

## 🚨 **Em Caso de Exposição Acidental**

1. **IMEDIATO**: Revogar credenciais expostas
2. **Git**: Remover do repositório e fazer force push
3. **Produção**: Atualizar com novas credenciais
4. **Logs**: Verificar se credenciais foram usadas maliciosamente

## 📋 **Checklist de Segurança**

- [ ] `.env` está no `.gitignore`
- [ ] Pre-commit hook está ativo
- [ ] GitHub Actions está funcionando
- [ ] Templates usam apenas placeholders
- [ ] Credenciais estão apenas em variáveis de ambiente
- [ ] Produção usa Coolify para gerenciar secrets

## 🔗 **Recursos Úteis**

- [Coolify Environment Variables](https://coolify.io/docs/environment-variables)
- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [TruffleHog Scanner](https://github.com/trufflesecurity/trufflehog)

---

**⚠️ Lembre-se: Segurança é responsabilidade de todos!**