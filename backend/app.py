from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
import uuid

app = Flask(__name__, static_folder='../frontend')
CORS(app)



BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get('FACESHOP_DB_PATH', os.path.join(BASE_DIR, 'faceshop.db'))

# ─── DATABASE SETUP ───────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def get_json_data():
    return request.get_json(silent=True) or {}

def normalize_email(email):
    return (email or '').strip().lower()

def public_user(row):
    user = dict(row)
    user.pop('face_descriptor', None)
    return user

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('cliente', 'vendedor', 'admin')),
            face_descriptor TEXT,
            avatar TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            category TEXT,
            image TEXT,
            seller_id TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            active INTEGER DEFAULT 1,
            FOREIGN KEY(seller_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pendente',
            payment_method TEXT,
            payment_status TEXT DEFAULT 'pendente',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(client_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS cart (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            added_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(client_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );
    ''')

    # Seed admin user
    c.execute("SELECT id FROM users WHERE email='admin@faceshop.com'")
    if not c.fetchone():
        c.execute("INSERT INTO users (id, name, email, role) VALUES (?,?,?,?)",
                  (str(uuid.uuid4()), 'Administrador', 'admin@faceshop.com', 'admin'))

    # Seed sample products
    c.execute("SELECT COUNT(*) FROM products")
    if c.fetchone()[0] == 0:
        products = [
            (str(uuid.uuid4()), 'AirPods Pro Max', 'Fone premium com cancelamento de ruído', 4999.99, 50, 'Eletrônicos', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=60&auto=format'),
            (str(uuid.uuid4()), 'MacBook Air M3', 'Laptop ultrafino com chip M3', 12999.99, 20, 'Computadores', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&q=60&auto=format'),
            (str(uuid.uuid4()), 'iPhone 16 Pro', 'Smartphone flagship da Apple', 9499.99, 35, 'Smartphones', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300&q=60&auto=format'),
            (str(uuid.uuid4()), 'Apple Watch Ultra', 'Smartwatch premium para aventuras', 6199.99, 15, 'Wearables', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=60&auto=format'),
            (str(uuid.uuid4()), 'iPad Pro 13"', 'Tablet profissional com chip M4', 10299.99, 25, 'Tablets', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&q=60&auto=format'),
            (str(uuid.uuid4()), 'Sony WH-1000XM5', 'Fone com melhor cancelamento do mercado', 1899.99, 40, 'Eletrônicos', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&q=60&auto=format'),
            (str(uuid.uuid4()), 'Samsung Galaxy S25', 'Flagship Android com IA integrada', 7999.99, 30, 'Smartphones', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&q=60&auto=format'),
            (str(uuid.uuid4()), 'Dell XPS 15', 'Notebook premium para criadores', 11499.99, 18, 'Computadores', 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300&q=60&auto=format'),
        ]
        c.executemany("INSERT INTO products (id, name, description, price, stock, category, image) VALUES (?,?,?,?,?,?,?)", products)

    conn.commit()
    conn.close()
    

# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = get_json_data()
    name = (data.get('name') or '').strip()
    email = normalize_email(data.get('email'))
    role = data.get('role')
    face_descriptor = data.get('faceDescriptor')

    if len(name) < 2:
        return jsonify({'success': False, 'error': 'Nome invalido'}), 400
    if '@' not in email:
        return jsonify({'success': False, 'error': 'Email invalido'}), 400
    if role not in ('cliente', 'vendedor', 'admin'):
        return jsonify({'success': False, 'error': 'Tipo de conta invalido'}), 400

    conn = get_db()
    c = conn.cursor()
    try:
        user_id = str(uuid.uuid4())
        c.execute(
            "INSERT INTO users (id, name, email, role, face_descriptor, avatar) VALUES (?,?,?,?,?,?)",
            (user_id, name, email, role,
             json.dumps(face_descriptor) if face_descriptor is not None else None, data.get('avatar'))
        )
        conn.commit()
        c.execute("SELECT * FROM users WHERE id=?", (user_id,))
        return jsonify({'success': True, 'user': public_user(c.fetchone())})
    except sqlite3.IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'error': 'Email ja cadastrado'}), 400
    finally:
        conn.close()
@app.route('/api/auth/face-login', methods=['POST'])
def face_login():
    data = get_json_data()
    descriptor = data.get('faceDescriptor')
    if not isinstance(descriptor, list):
        return jsonify({'success': False, 'error': 'Descriptor nao fornecido'}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE face_descriptor IS NOT NULL AND active=1")
    users = c.fetchall()
    conn.close()

    import math

    def euclidean_distance(a, b):
        return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))

    best_match = None
    best_dist = float('inf')
    THRESHOLD = 0.5

    for user in users:
        try:
            stored = json.loads(user['face_descriptor'])
        except (TypeError, json.JSONDecodeError):
            continue
        if isinstance(stored, list) and len(stored) == len(descriptor):
            dist = euclidean_distance(descriptor, stored)
            if dist < best_dist:
                best_dist = dist
                best_match = user

    if best_match and best_dist < THRESHOLD:
        return jsonify({'success': True, 'user': public_user(best_match), 'distance': best_dist})

    return jsonify({'success': False, 'error': 'Rosto nao reconhecido'}), 401
@app.route('/api/auth/email-login', methods=['POST'])
def email_login():
    data = get_json_data()
    email = normalize_email(data.get('email'))
    if not email:
        return jsonify({'success': False, 'error': 'Email nao fornecido'}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email=? AND active=1", (email,))
    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({'success': False, 'error': 'Usuario nao encontrado'}), 401

    return jsonify({'success': True, 'user': public_user(user)})
@app.route('/api/auth/update-face', methods=['POST'])
def update_face():
    data = get_json_data()
    if not data.get('userId') or not isinstance(data.get('faceDescriptor'), list):
        return jsonify({'success': False, 'error': 'Dados invalidos'}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE users SET face_descriptor=? WHERE id=?",
              (json.dumps(data['faceDescriptor']), data['userId']))
    conn.commit()
    updated = c.rowcount
    conn.close()
    if not updated:
        return jsonify({'success': False, 'error': 'Usuario nao encontrado'}), 404
    return jsonify({'success': True})
# ─── PRODUCTS ROUTES ──────────────────────────────────────────────────────────

@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    include_inactive = request.args.get('include_inactive') in ('1', 'true', 'True')
    conn = get_db()
    c = conn.cursor()
    where = [] if include_inactive else ['active=1']
    values = []
    if category:
        where.append('category=?')
        values.append(category)
    sql = 'SELECT * FROM products'
    if where:
        sql += ' WHERE ' + ' AND '.join(where)
    sql += ' ORDER BY created_at DESC'
    c.execute(sql, values)
    products = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(products)

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM products WHERE id=?", (product_id,))
    p = c.fetchone()
    conn.close()
    if p:
        return jsonify(dict(p))
    return jsonify({'error': 'Produto nao encontrado'}), 404

@app.route('/api/products', methods=['POST'])
def create_product():
    data = get_json_data()
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'error': 'Nome do produto e obrigatorio'}), 400
    try:
        price = float(data.get('price'))
        stock = int(data.get('stock', 0))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'error': 'Preco ou estoque invalido'}), 400
    if price < 0 or stock < 0:
        return jsonify({'success': False, 'error': 'Preco e estoque nao podem ser negativos'}), 400

    conn = get_db()
    c = conn.cursor()
    try:
        pid = str(uuid.uuid4())
        c.execute(
            "INSERT INTO products (id, name, description, price, stock, category, image, seller_id) VALUES (?,?,?,?,?,?,?,?)",
            (pid, name, data.get('description'), price, stock,
             data.get('category'), data.get('image'), data.get('seller_id'))
        )
        conn.commit()
        c.execute("SELECT * FROM products WHERE id=?", (pid,))
        product = dict(c.fetchone())
        return jsonify({'success': True, 'product': product})
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    data = get_json_data()
    allowed = {'name', 'description', 'price', 'stock', 'category', 'image', 'active'}
    fields = []
    values = []

    for field in allowed:
        if field not in data:
            continue
        value = data[field]
        try:
            if field == 'price':
                value = float(value)
                if value < 0:
                    raise ValueError
            elif field == 'stock':
                value = int(value)
                if value < 0:
                    raise ValueError
            elif field == 'active':
                value = 1 if value else 0
        except (TypeError, ValueError):
            return jsonify({'success': False, 'error': f'Campo {field} invalido'}), 400
        fields.append(f"{field}=?")
        values.append(value)

    if not fields:
        return jsonify({'success': False, 'error': 'Nenhum campo para atualizar'}), 400

    values.append(product_id)
    conn = get_db()
    c = conn.cursor()
    c.execute(f"UPDATE products SET {', '.join(fields)} WHERE id=?", values)
    conn.commit()
    if c.rowcount == 0:
        conn.close()
        return jsonify({'success': False, 'error': 'Produto nao encontrado'}), 404
    c.execute("SELECT * FROM products WHERE id=?", (product_id,))
    product = dict(c.fetchone())
    conn.close()
    return jsonify({'success': True, 'product': product})

@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE products SET active=0 WHERE id=?", (product_id,))
    conn.commit()
    updated = c.rowcount
    conn.close()
    if not updated:
        return jsonify({'success': False, 'error': 'Produto nao encontrado'}), 404
    return jsonify({'success': True})
# ─── CART ROUTES ──────────────────────────────────────────────────────────────

@app.route('/api/cart/<client_id>', methods=['GET'])
def get_cart(client_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
        FROM cart c JOIN products p ON c.product_id = p.id
        WHERE c.client_id=? AND p.active=1
    """, (client_id,))
    items = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(items)

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    data = get_json_data()
    client_id = data.get('client_id')
    product_id = data.get('product_id')
    try:
        quantity = int(data.get('quantity', 1))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'error': 'Quantidade invalida'}), 400
    if not client_id or not product_id or quantity <= 0:
        return jsonify({'success': False, 'error': 'Dados do carrinho invalidos'}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT stock FROM products WHERE id=? AND active=1", (product_id,))
    product = c.fetchone()
    if not product:
        conn.close()
        return jsonify({'success': False, 'error': 'Produto nao encontrado'}), 404
    if product['stock'] < quantity:
        conn.close()
        return jsonify({'success': False, 'error': 'Estoque insuficiente'}), 400

    c.execute("SELECT id, quantity FROM cart WHERE client_id=? AND product_id=?",
              (client_id, product_id))
    existing = c.fetchone()
    if existing:
        c.execute("UPDATE cart SET quantity=quantity+? WHERE id=?",
                  (quantity, existing['id']))
    else:
        c.execute("INSERT INTO cart (id, client_id, product_id, quantity) VALUES (?,?,?,?)",
                  (str(uuid.uuid4()), client_id, product_id, quantity))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/cart/<item_id>', methods=['PUT'])
def update_cart_item(item_id):
    data = get_json_data()
    try:
        quantity = int(data.get('quantity', 0))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'error': 'Quantidade invalida'}), 400

    conn = get_db()
    c = conn.cursor()
    if quantity <= 0:
        c.execute("DELETE FROM cart WHERE id=?", (item_id,))
    else:
        c.execute("""
            UPDATE cart
            SET quantity=?
            WHERE id=? AND ? <= (
                SELECT stock FROM products WHERE products.id = cart.product_id
            )
        """, (quantity, item_id, quantity))
    conn.commit()
    updated = c.rowcount
    conn.close()
    if not updated and quantity > 0:
        return jsonify({'success': False, 'error': 'Item nao encontrado ou estoque insuficiente'}), 400
    return jsonify({'success': True})

@app.route('/api/cart/<item_id>', methods=['DELETE'])
def remove_cart_item(item_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM cart WHERE id=?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})
# ─── ORDERS ROUTES ────────────────────────────────────────────────────────────

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = get_json_data()
    client_id = data.get('client_id')
    items = data.get('items') or []
    payment_method = data.get('payment_method') or 'pix'
    if not client_id or not items:
        return jsonify({'success': False, 'error': 'Pedido invalido'}), 400

    normalized_items = []
    try:
        for item in items:
            normalized_items.append({
                'product_id': item['product_id'],
                'quantity': int(item['quantity']),
                'unit_price': float(item['unit_price']),
            })
    except (KeyError, TypeError, ValueError):
        return jsonify({'success': False, 'error': 'Itens do pedido invalidos'}), 400
    if any(i['quantity'] <= 0 or i['unit_price'] < 0 for i in normalized_items):
        return jsonify({'success': False, 'error': 'Itens do pedido invalidos'}), 400

    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('BEGIN IMMEDIATE')
        c.execute("SELECT id FROM users WHERE id=? AND role='cliente' AND active=1", (client_id,))
        if not c.fetchone():
            conn.rollback()
            return jsonify({'success': False, 'error': 'Cliente nao encontrado'}), 404

        total = 0
        for item in normalized_items:
            c.execute("SELECT stock FROM products WHERE id=? AND active=1", (item['product_id'],))
            product = c.fetchone()
            if not product:
                conn.rollback()
                return jsonify({'success': False, 'error': 'Produto nao encontrado'}), 404
            if product['stock'] < item['quantity']:
                conn.rollback()
                return jsonify({'success': False, 'error': 'Estoque insuficiente'}), 400
            total += item['quantity'] * item['unit_price']

        order_id = str(uuid.uuid4())
        c.execute(
            "INSERT INTO orders (id, client_id, total, payment_method, payment_status, status) VALUES (?,?,?,?,?,?)",
            (order_id, client_id, total, payment_method, 'aprovado', 'confirmado')
        )
        for item in normalized_items:
            c.execute(
                "INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?,?,?,?,?)",
                (str(uuid.uuid4()), order_id, item['product_id'], item['quantity'], item['unit_price'])
            )
            c.execute("UPDATE products SET stock=stock-? WHERE id=?", (item['quantity'], item['product_id']))
        c.execute("DELETE FROM cart WHERE client_id=?", (client_id,))
        conn.commit()
        return jsonify({'success': True, 'order_id': order_id})
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/orders/<client_id>', methods=['GET'])
def get_orders(client_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM orders WHERE client_id=? ORDER BY created_at DESC", (client_id,))
    orders = [dict(r) for r in c.fetchall()]
    for order in orders:
        c.execute("""
            SELECT oi.*, p.name, p.image FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id=?
        """, (order['id'],))
        order['items'] = [dict(i) for i in c.fetchall()]
    conn.close()
    return jsonify(orders)
# ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, name, email, role, avatar, created_at, active FROM users ORDER BY created_at DESC")
    users = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(users)

@app.route('/api/admin/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    data = get_json_data()
    fields = []
    values = []

    if 'name' in data:
        name = (data.get('name') or '').strip()
        if len(name) < 2:
            return jsonify({'success': False, 'error': 'Nome invalido'}), 400
        fields.append('name=?')
        values.append(name)
    if 'email' in data:
        email = normalize_email(data.get('email'))
        if '@' not in email:
            return jsonify({'success': False, 'error': 'Email invalido'}), 400
        fields.append('email=?')
        values.append(email)
    if 'role' in data:
        if data.get('role') not in ('cliente', 'vendedor', 'admin'):
            return jsonify({'success': False, 'error': 'Tipo de conta invalido'}), 400
        fields.append('role=?')
        values.append(data['role'])
    if 'active' in data:
        fields.append('active=?')
        values.append(1 if data.get('active') else 0)

    if not fields:
        return jsonify({'success': False, 'error': 'Nenhum campo para atualizar'}), 400

    values.append(user_id)
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=?", values)
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        conn.close()
        return jsonify({'success': False, 'error': 'Email ja cadastrado'}), 400
    updated = c.rowcount
    conn.close()
    if not updated:
        return jsonify({'success': False, 'error': 'Usuario nao encontrado'}), 404
    return jsonify({'success': True})
@app.route('/api/admin/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM users WHERE role='cliente'")
    clients = c.fetchone()['total']
    c.execute("SELECT COUNT(*) as total FROM users WHERE role='vendedor'")
    sellers = c.fetchone()['total']
    c.execute("SELECT COUNT(*) as total FROM products WHERE active=1")
    products = c.fetchone()['total']
    c.execute("SELECT COUNT(*) as total, COALESCE(SUM(total),0) as revenue FROM orders WHERE status='confirmado'")
    row = c.fetchone()
    conn.close()
    return jsonify({
        'clients': clients, 'sellers': sellers,
        'products': products, 'orders': row['total'], 'revenue': row['revenue']
    })

@app.route('/api/admin/orders', methods=['GET'])
def get_all_orders():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT o.*, u.name as client_name, u.email as client_email
        FROM orders o JOIN users u ON o.client_id = u.id
        ORDER BY o.created_at DESC
    """)
    orders = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(orders)

# ─── STATIC FILES ─────────────────────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


init_db()

if __name__ == '__main__':
    print("✅ FaceShop backend iniciado em http://localhost:5000")
    app.run(host="0.0.0.0", port=5000)
