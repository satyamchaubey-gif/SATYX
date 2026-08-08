import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from pymongo import MongoClient

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URI","mongodb://localhost:27017"))
db = client[os.getenv("MONGODB_DB","satyx")]
users, products, orders = db.users, db.products, db.orders
SECRET = os.getenv("JWT_SECRET","CHANGE_ME")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL","admin@satyx.in")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD","CHANGE_ME")
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="SATYX API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500","http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Register(BaseModel):
    name: str = Field(min_length=2,max_length=80)
    email: EmailStr
    mobile: str = Field(min_length=10,max_length=20)
    password: str = Field(min_length=8,max_length=128)

class Login(BaseModel):
    email: EmailStr
    password: str

class OrderItem(BaseModel):
    product_id: str
    size: str
    qty: int = Field(gt=0,le=20)

class OrderCreate(BaseModel):
    items: list[OrderItem]
    customer_name: str
    email: EmailStr
    mobile: str
    address: str
    city: str
    pincode: str
    payment_method: str = "COD"

def make_token(sub,role):
    payload={"sub":sub,"role":role,
             "exp":datetime.now(timezone.utc)+timedelta(hours=12)}
    return jwt.encode(payload,SECRET,algorithm="HS256")

def auth(authorization: Optional[str]=Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401,"Authentication required")
    try:
        return jwt.decode(authorization.split(" ",1)[1],SECRET,algorithms=["HS256"])
    except JWTError:
        raise HTTPException(401,"Invalid or expired session")

def admin(user=Depends(auth)):
    if user.get("role")!="admin":
        raise HTTPException(403,"Admin access required")
    return user

@app.get("/api/health")
def health(): return {"ok":True,"service":"SATYX"}

@app.post("/api/auth/register")
def register(data:Register):
    email=data.email.lower()
    if users.find_one({"email":email}):
        raise HTTPException(409,"Email already registered")
    doc={"name":data.name.strip(),"email":email,"mobile":data.mobile.strip(),
         "password_hash":pwd.hash(data.password),"role":"customer",
         "created_at":datetime.now(timezone.utc),"last_login":None}
    r=users.insert_one(doc)
    return {"token":make_token(str(r.inserted_id),"customer"),"name":doc["name"]}

@app.post("/api/auth/login")
def login(data:Login):
    u=users.find_one({"email":data.email.lower()})
    if not u or not pwd.verify(data.password,u["password_hash"]):
        raise HTTPException(401,"Incorrect email or password")
    users.update_one({"_id":u["_id"]},{"$set":{"last_login":datetime.now(timezone.utc)}})
    return {"token":make_token(str(u["_id"]),u.get("role","customer")),"name":u["name"]}

@app.post("/api/admin/login")
def admin_login(data:Login):
    if data.email.lower()!=ADMIN_EMAIL.lower() or data.password!=ADMIN_PASSWORD:
        raise HTTPException(401,"Invalid admin credentials")
    return {"token":make_token("admin","admin")}

@app.get("/api/products")
def get_products():
    return list(products.find({},{"_id":0}))

@app.get("/api/admin/customers")
def get_customers(user=Depends(admin)):
    return list(users.find({"role":"customer"},{"_id":0,"password_hash":0}).sort("created_at",-1))

@app.get("/api/admin/orders")
def get_orders(user=Depends(admin)):
    return list(orders.find({},{"_id":0}).sort("created_at",-1))

@app.post("/api/orders")
def create_order(data:OrderCreate,user=Depends(auth)):
    if not data.items: raise HTTPException(400,"Cart is empty")
    subtotal=0
    clean=[]
    for item in data.items:
        p=products.find_one({"id":item.product_id})
        if not p: raise HTTPException(404,"Product not found")
        stock=int(p.get("stock",{}).get(item.size,0))
        if stock<item.qty:
            raise HTTPException(409,f"Insufficient stock: {p['name']} / {item.size}")
        subtotal += float(p["price"])*item.qty
        clean.append({"product_id":p["id"],"name":p["name"],"size":item.size,
                      "qty":item.qty,"unit_price":float(p["price"])})
    shipping=0 if subtotal>=1499 else 79
    order={"id":"SATYX-"+str(int(datetime.now().timestamp()))[-8:],
           "user_id":user["sub"],"customer":{"name":data.customer_name,
           "email":data.email.lower(),"mobile":data.mobile,"address":data.address,
           "city":data.city,"pincode":data.pincode},"items":clean,
           "subtotal":subtotal,"shipping":shipping,"total":subtotal+shipping,
           "payment_method":data.payment_method,"payment_status":"pending",
           "status":"pending","created_at":datetime.now(timezone.utc)}
    orders.insert_one(order)
    for i in clean:
        products.update_one({"id":i["product_id"]},
                            {"$inc":{f"stock.{i['size']}":-i["qty"]}})
    return {"order_id":order["id"],"total":order["total"]}
