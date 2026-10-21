
import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error(
      "MONGO_URL is missing from Render environment variables."
    );
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log("DB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
