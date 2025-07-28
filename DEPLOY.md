# 🚀 Deploy na Vercel - Guia Completo

## ✅ Pré-requisitos
- [ ] Projeto buildando sem erros (`npm run build`)
- [ ] Conta na Vercel (https://vercel.com)
- [ ] GitHub account (para deploy automático)

## 📋 Checklist Pré-Deploy

### 1. Otimizações Implementadas
- ✅ Code splitting por vendor/ui/three.js
- ✅ Minificação com Terser
- ✅ Remoção de console.logs em produção
- ✅ Headers de segurança configurados
- ✅ Cache otimizado para assets estáticos

### 2. Configuração Vercel
- ✅ `vercel.json` criado com rewrites para SPA
- ✅ `vite.config.ts` otimizado para produção

## 🛠️ Passos para Deploy

### Opção 1: Deploy via GitHub (Recomendado)
1. **Push para GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: ready for vercel deploy"
   git branch -M main
   git remote add origin https://github.com/SEU_USERNAME/SEU_REPO.git
   git push -u origin main
   ```

2. **Na Vercel:**
   - Acesse https://vercel.com/dashboard
   - Clique "New Project"
   - Importe seu repositório GitHub
   - Vercel detectará automaticamente Vite
   - Deploy automático!

### Opção 2: Deploy via Vercel CLI
1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

## 🎯 Otimizações de Performance

### Lazy Loading Implementado
- Componentes pesados carregam sob demanda
- Chunks separados por funcionalidade

### Cache Strategy
- Assets estáticos: 1 ano de cache
- HTML: sem cache (sempre fresh)

### Bundle Analysis
```bash
npm run build
# Verifique o tamanho dos chunks na pasta dist/
```

## 🔧 Troubleshooting

### Build Fails?
```bash
# Limpe node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 em Routes?
- ✅ `vercel.json` já configurado com rewrites

### Lentidão?
- Componentes Three.js otimizados com chunks separados
- Images já otimizadas

## 📊 Métricas Esperadas
- **First Load:** < 3s
- **Lighthouse Score:** 90+
- **Bundle Size:** < 1MB total

## 🌐 Domínio Personalizado
1. Na Vercel Dashboard → Project Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções da Vercel

---

**🎉 Seu site estará live em:** `https://seu-projeto.vercel.app` 