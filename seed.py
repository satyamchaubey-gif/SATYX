import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "satyx")

INITIAL_PRODUCTS = [
    {
        "id": "arc-core",
        "name": "Arc Core Oversized Tee",
        "description": "Heavyweight 240 GSM combed cotton. Boxy architectural cut with high-density brand prints on chest and spine.",
        "price": 899,
        "mrp": 1199,
        "images": ["arc-core.jpg"],
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "stock": 50,
        "collection": "Drop 001"
    },
    {
        "id": "hero-code",
        "name": "Hero Code Boxy Tee",
        "description": "Custom milled dark gray fabric. Double needle stitch finish with custom SATYX internal neck taping.",
        "price": 999,
        "mrp": 1299,
        "images": ["hero-code.jpg"],
        "sizes": ["S", "M", "L", "XL"],
        "stock": 35,
        "collection": "Drop 001"
    },
    {
        "id": "multiverse-heavy",
        "name": "Multiverse Graphic Heavy Tee",
        "description": "Pre-shrunk ultra-heavyweight cotton. High-definition screenprint inspired by brutalist software architecture.",
        "price": 1099,
        "mrp": 1499,
        "images": ["multiverse.jpg"],
        "sizes": ["M", "L", "XL"],
        "stock": 20,
        "collection": "Drop 001"
    }
]

async def seed_db():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB]
    
    print("Clearing existing product collection...")
    await db.products.delete_many({})
    
    print("Seeding initial SATYX collection...")
    await db.products.insert_many(INITIAL_PRODUCTS)
    
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_db())
