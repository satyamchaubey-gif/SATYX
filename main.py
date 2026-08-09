import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt

# Environmental Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "satyx")
JWT_SECRET = os.getenv("JWT_SECRET", "SATYX_SUPER_SECRET_KEY_CHANGE_IN_PROD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@satyx.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "SATYX_ADMIN_SECURE_PASS_2026")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days

# Security Hashing Engine
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# MongoDB Asynchronous Client
client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB]

app = FastAPI(title="SATYX Core Engine", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProductSchema(BaseModel):
    id: str
    name: str
    description: str
    price: int
    mrp: Optional[int] = None
    images: List[str]
    sizes: List[str]
    stock: int
    collection: str

class OrderItem(BaseModel):
    product_id: str
    size: str
    quantity: int

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_mobile: str
    shipping_address: str
    city: str
    state: str
    pincode: str
    payment_method: str
    items: List[OrderItem]

class OrderStatusUpdate(BaseModel):
    order_status: str

# --- AUTH UTILITIES ---

function_hash_password = lambda password: pwd_context.hash(password)
function_verify_password = lambda plain, hashed: pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.customers.find_one({"email": email})
    if user is None and email != ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="User not found")
    return user or {"email": ADMIN_EMAIL, "role": "admin"}

async def verify_admin_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin permissions required")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- AUTH ROUTES ---

@app.post("/api/auth/register")
async def register(user: UserRegister):
    existing = await db.customers.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Customer email already registered")

    customer_doc = {
        "name": user.name,
        "email": user.email,
        "mobile": user.mobile,
        "password_hash": function_hash_password(user.password),
        "created_at": datetime.datetime.utcnow(),
        "last_login": datetime.datetime.utcnow()
    }
    await db.customers.insert_one(customer_doc)
    return {"message": "Account created successfully"}

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    customer = await db.customers.find_one({"email": credentials.email})
    if not customer or not function_verify_password(credentials.password, customer["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    await db.customers.update_one({"_id": customer["_id"]}, {"$set": {"last_login": datetime.datetime.utcnow()}})
    
    token = create_access_token({"sub": customer["email"], "role": "customer"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "name": customer["name"],
            "email": customer["email"],
            "mobile": customer["mobile"]
        }
    }

# --- PRODUCT ROUTES ---

@app.get("/api/products")
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(length=100)
    return products

@app.get("/api/products/{id}")
async def get_product(id: str):
    product = await db.products.find_one({"id": id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# --- ORDER ROUTES ---

@app.post("/api/orders")
async def create_order(order_data: OrderCreate):
    subtotal = 0
    validated_items = []

    # SERVER-SIDE PRICE & INVENTORY VALIDATION
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} unavailable")
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient inventory for {product['name']}")

        item_price = product["price"]
        subtotal += item_price * item.quantity

        validated_items.append({
            "product_id": product["id"],
            "name": product["name"],
            "price": item_price,
            "size": item.size,
            "quantity": item.quantity
        })

    shipping = 0 if subtotal > 2000 else 150
    total = subtotal + shipping

    order_id = f"SATYX-{int(datetime.datetime.utcnow().timestamp())}"

    order_doc = {
        "order_id": order_id,
        "customer_name": order_data.customer_name,
        "customer_email": order_data.customer_email,
        "customer_mobile": order_data.customer_mobile,
        "shipping_address": order_data.shipping_address,
        "city": order_data.city,
        "state": order_data.state,
        "pincode": order_data.pincode,
        "items": validated_items,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "payment_method": order_data.payment_method,
        "payment_status": "PENDING",
        "order_status": "PROCESSING",
        "created_at": datetime.datetime.utcnow()
    }

    await db.orders.insert_one(order_doc)

    # DEDUCT STOCK
    for item in order_data.items:
        await db.products.update_one({"id": item.product_id}, {"$inc": {"stock": -item.quantity}})

    return {"message": "Order created", "order_id": order_id, "total": total}

@app.get("/api/orders/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"customer_email": current_user["email"]}, {"_id": 0}).to_list(length=100)
    return orders

# --- ADMIN ENDPOINTS ---

@app.post("/api/admin/login")
async def admin_login(credentials: UserLogin):
    if credentials.email == ADMIN_EMAIL and credentials.password == ADMIN_PASSWORD:
        token = create_access_token({"sub": ADMIN_EMAIL, "role": "admin"})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=400, detail="Invalid admin credentials")

@app.get("/api/admin/customers", dependencies=[Depends(verify_admin_user)])
async def admin_get_customers():
    return await db.customers.find({}, {"_id": 0, "password_hash": 0}).to_list(length=500)

@app.get("/api/admin/orders", dependencies=[Depends(verify_admin_user)])
async def admin_get_orders():
    return await db.orders.find({}, {"_id": 0}).to_list(length=500)

@app.get("/api/admin/products", dependencies=[Depends(verify_admin_user)])
async def admin_get_products():
    return await db.products.find({}, {"_id": 0}).to_list(length=500)

@app.post("/api/admin/products", dependencies=[Depends(verify_admin_user)])
async def admin_create_product(product: ProductSchema):
    await db.products.insert_one(product.dict())
    return {"message": "Product created"}

@app.patch("/api/admin/orders/{order_id}", dependencies=[Depends(verify_admin_user)])
async def admin_update_order(order_id: str, status_update: OrderStatusUpdate):
    await db.orders.update_one({"order_id": order_id}, {"$set": {"order_status": status_update.order_status}})
    return {"message": "Order status updated"}
