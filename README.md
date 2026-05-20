# 🤳 FaceShop — Loja Virtual com Reconhecimento Facial

Plataforma completa de e-commerce com autenticação por biometria facial.

---

## 🏗️ Estrutura do Projeto

```
faceshop/
├── backend/
│   ├── app.py              # API Flask + banco SQLite
│   ├── requirements.txt    # Dependências Python
│   └── faceshop.db         # (criado automaticamente)
│
├── frontend/
│   ├── index.html          # Entry point
│   ├── css/
│   │   └── main.css        # Design system completo
│   └── js/
│       ├── api.js           # Cliente HTTP + utilitários UI
│       ├── auth.js          # face-api.js (reconhecimento)
│       ├── store.js         # Carrinho + checkout + pagamentos
│       ├── app.js           # Roteamento principal
│       └── pages/
│           ├── login.js     # Login facial + email
│           ├── register.js  # Cadastro com captura facial
│           ├── client.js    # Catálogo, busca, pedidos
│           ├── seller.js    # Gestão de produtos
│           └── admin.js     # Dashboard completo
│
└── start.sh                # Script de inicialização
```

---

## 🚀 Como Rodar

### 1. Backend (Python/Flask)
```bash
cd faceshop/backend
pip install flask flask-cors
python app.py
# → Rodando em http://localhost:5000
```

### 2. Frontend
Abra `frontend/index.html` com qualquer servidor local:

```bash
# Opção A: VS Code Live Server (recomendado)
# Opção B:
cd faceshop/frontend
python3 -m http.server 3000
# → Abra http://localhost:3000
```

---

## 👥 Tipos de Acesso

### 🛍️ Cliente
- Login por reconhecimento facial
- Catálogo de produtos com busca e filtros por categoria
- Carrinho de compras com ajuste de quantidades
- Checkout com 3 formas de pagamento: PIX, Cartão, Boleto
- Histórico de pedidos

### 🏪 Vendedor
- Adicionar / editar / pausar produtos
- Upload de imagem via URL
- Controle de estoque e preço
- Estatísticas de produtos por categoria
- Alerta de estoque baixo

### 👑 Administrador
- Dashboard com métricas completas (usuários, pedidos, receita)
- Gerenciamento completo de usuários (editar, ativar/desativar)
- Visão geral de todos os produtos
- Histórico de todos os pedidos com totais
- Impersonação: ver a plataforma como Cliente ou Vendedor

---

## 🧠 Reconhecimento Facial

Usa **face-api.js** (CDN) com os modelos:
- `TinyFaceDetector` — detecção rápida
- `FaceLandmark68Net` — 68 pontos faciais
- `FaceRecognitionNet` — vetor de 128 dimensões

**Fluxo de autenticação:**
1. Câmera captura frames em tempo real
2. face-api extrai o descritor facial (array Float32 de 128 valores)
3. No login: comparação por distância euclidiana com todos os usuários
4. Limiar de similaridade: **0.5** (configurável em `app.py`)

---

## 🗄️ Banco de Dados (SQLite)

Tabelas:
| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários com descritor facial armazenado como JSON |
| `products` | Catálogo de produtos |
| `orders` | Pedidos realizados |
| `order_items` | Itens de cada pedido |
| `cart` | Carrinho temporário por usuário |

---

## 🔧 Configuração

### CORS
O backend aceita requisições de qualquer origem (dev). Em produção, configure:
```python
CORS(app, origins=["https://seu-dominio.com"])
```

### Threshold de reconhecimento
Em `backend/app.py`, linha `THRESHOLD = 0.5`:
- Menor = mais restrito
- Maior = mais permissivo

---

## 📦 Produtos de Demonstração

O banco é populado com 8 produtos de exemplo (eletrônicos premium) e um admin padrão:
- **Email:** `admin@faceshop.com`
- **Login:** via email (aba "Email" na tela de login)

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Reconhecimento Facial | face-api.js |
| Backend | Python 3 + Flask |
| Banco de Dados | SQLite (via módulo `sqlite3`) |
| Estilo | Design system próprio (dark luxury) |


