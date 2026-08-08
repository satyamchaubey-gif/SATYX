import os
from pymongo import MongoClient
from dotenv import load_dotenv
load_dotenv()
db=MongoClient(os.getenv("MONGODB_URI","mongodb://localhost:27017"))[os.getenv("MONGODB_DB","satyx")]
db.products.delete_many({})
db.products.insert_many([
{"id":"arc-core","name":"Arc Core Oversized Tee","price":899,"old_price":1199,"image":"assets/arc-core.jpg","tag":"Drop 001","category":"drop","description":"Power Within.","sizes":["S","M","L","XL","XXL"],"stock":{"S":5,"M":10,"L":10,"XL":5,"XXL":3}},
{"id":"multiverse","name":"Multiverse Oversized Tee","price":899,"old_price":1199,"image":"assets/multiverse.jpg","tag":"Drop 001","category":"drop","description":"Different realities. Same purpose.","sizes":["S","M","L","XL","XXL"],"stock":{"S":5,"M":10,"L":10,"XL":5,"XXL":3}},
{"id":"hero-code","name":"Hero Code Oversized Tee","price":899,"old_price":1199,"image":"assets/hero-code.jpg","tag":"Drop 001","category":"drop","description":"Code. Discipline. Focus. Purpose.","sizes":["S","M","L","XL","XXL"],"stock":{"S":5,"M":10,"L":10,"XL":5,"XXL":3}}
])
print("SATYX products seeded.")
