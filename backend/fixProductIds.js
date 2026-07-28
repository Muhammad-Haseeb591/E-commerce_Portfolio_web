require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product"); // apna actual path lagayen

async function run() {
  await mongoose.connect("mongodb+srv://hm597457_db_user:Haseeb161@cluster0.f6qbwiy.mongodb.net/products?retryWrites=true&w=majority"); // apna .env connection string

  const badProducts = await Product.find({
    $or: [{ productId: "" }, { productId: { $exists: false } }],
  });

  console.log(`Found ${badProducts.length} products with missing/empty productId`);

  for (const doc of badProducts) {
    doc.productId = `PRD-${doc._id}`;
    await doc.save({ validateBeforeSave: false }); // duplicate-color validators wagera skip, sirf ID fix karna hai
    console.log(`Fixed: ${doc._id} -> ${doc.productId}`);
  }

  console.log("Done!");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});