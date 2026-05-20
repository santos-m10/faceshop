#!/bin/bash
# ═══════════════════════════════════════════════
#  FaceShop - Script de Instalação e Execução
# ═══════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║       FACESHOP — Instalação           ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Python3 não encontrado. Instale Python 3.8+"
  exit 1
fi

echo "✓ Python3 encontrado: $(python3 --version)"

# Install deps
echo ""
echo "📦 Instalando dependências Python..."
cd backend
pip3 install -r requirements.txt -q

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "🚀 Iniciando servidor..."
echo "   Backend: http://localhost:5000"
echo "   Frontend: Abra frontend/index.html no navegador"
echo ""
echo "   DICA: Use Live Server no VS Code para o frontend"
echo "         ou execute: python3 -m http.server 3000 (na pasta frontend)"
echo ""

python3 app.py