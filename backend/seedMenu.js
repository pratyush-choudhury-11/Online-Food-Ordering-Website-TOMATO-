import "dotenv/config";
import mongoose from "mongoose";
import foodModel from "./models/foodModel.js";

const menu = [
  ["Greek salad", 12, "Salad"],
  ["Veg salad", 18, "Salad"],
  ["Clover Salad", 16, "Salad"],
  ["Chicken Salad", 24, "Salad"],

  ["Lasagna Rolls", 14, "Rolls"],
  ["Peri Peri Rolls", 12, "Rolls"],
  ["Chicken Rolls", 20, "Rolls"],
  ["Veg Rolls", 15, "Rolls"],

  ["Ripple Ice Cream", 14, "Desserts"],
  ["Fruit Ice Cream", 22, "Desserts"],
  ["Jar Ice Cream", 10, "Desserts"],
  ["Vanilla Ice Cream", 12, "Desserts"],
  ["Cup Cake", 14, "Desserts"],
  ["Vegan Cake", 12, "Desserts"],
  ["Butterscotch Cake", 20, "Desserts"],
  ["Sliced Cake", 15, "Desserts"],

  ["Chicken Sandwich", 12, "Sandwich"],
  ["Vegan Sandwich", 18, "Sandwich"],
  ["Grilled Sandwich", 16, "Sandwich"],
  ["Bread Sandwich", 24, "Sandwich"],

  ["Garlic Mushroom", 14, "Pure Veg"],
  ["Fried Cauliflower", 22, "Pure Veg"],
  ["Mix Veg Pulao", 10, "Pure Veg"],
  ["Rice Zucchini", 12, "Pure Veg"],

  ["Cheese Pasta", 12, "Pasta"],
  ["Tomato Pasta", 18, "Pasta"],
  ["Creamy Pasta", 16, "Pasta"],
  ["Chicken Pasta", 24, "Pasta"],

  ["Butter Noodles", 14, "Noodles"],
  ["Veg Noodles", 12, "Noodles"],
  ["Somen Noodles", 20, "Noodles"],
  ["Cooked Noodles", 15, "Noodles"],
];

const descriptions = {
  Salad: "A fresh and delicious salad made with quality ingredients.",
  Rolls: "A tasty roll prepared with flavorful ingredients.",
  Desserts: "A delicious sweet treat for every occasion.",
  Sandwich: "A freshly prepared sandwich, perfect for a quick meal.",
  "Pure Veg": "A delicious vegetarian dish prepared with fresh ingredients.",
  Pasta: "A comforting pasta dish with a rich and flavorful taste.",
  Noodles: "A tasty noodle dish prepared with fresh ingredients.",
};

async function seedMenu() {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is missing from environment variables.");
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB.");

    // Reuse an existing image so the records have a valid
    // image filename. Replace these placeholders with real
    // dish images before publishing the final menu.
    const existingPasta = await foodModel.findOne({
      name: "Chizzy Pasta",
    });

    if (!existingPasta) {
      throw new Error(
        "Chizzy Pasta was not found. Add it first and rerun this script."
      );
    }

    const existingNames = await foodModel.find(
      {},
      { name: 1 }
    );

    const nameSet = new Set(
      existingNames.map((item) => item.name.toLowerCase())
    );

    const newItems = menu
      .filter(([name]) => !nameSet.has(name.toLowerCase()))
      .map(([name, price, category]) => ({
        name,
        description: descriptions[category],
        price,
        category,
        image: existingPasta.image,
      }));

    if (newItems.length > 0) {
      await foodModel.insertMany(newItems);
    }

    console.log(`Menu items already present: ${nameSet.size}`);
    console.log(`New menu items added: ${newItems.length}`);
    console.log("Menu seeding completed.");
  } catch (error) {
    console.error("Menu seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedMenu();
