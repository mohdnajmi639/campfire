const mongoose = require("mongoose");

async function checkDb() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Successfully connected!");

    const db = mongoose.connection.db;
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log("\n--- Collections ---");
    if (collections.length === 0) {
      console.log("No collections found. Database is currently empty.");
    }
    
    for (let collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
      
      if (collection.name === "users") {
        console.log("\n  [User Documents]:");
        const users = await db.collection("users").find({}).limit(5).toArray();
        users.forEach(u => {
           console.log(`  > Name: ${u.name}, Email: ${u.email}`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected.");
  }
}

checkDb();
