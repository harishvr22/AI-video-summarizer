from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)
db = client["video_summarizer"]
activities_collection = db["activities"]
print("✅ MongoDB connected successfully")
