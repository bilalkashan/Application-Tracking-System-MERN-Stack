import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongdb_url = process.env.MONGODB_CONN;

if (!mongdb_url) {
  console.error(
    "❌ MONGODB_CONN is not set in environment. Aborting connection attempt."
  );
}

// Recommended safety options
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // fail fast
};

// In production avoid building indexes at runtime
if (process.env.NODE_ENV === "production") {
  connectOptions.autoIndex = false;
}

// Enforce strict query parsing to avoid ambiguous queries
mongoose.set("strictQuery", true);

mongoose
  .connect(mongdb_url || "", connectOptions)
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((e) => {
    console.error("Mongo DB Error", e);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.disconnect();
    console.log("Mongoose disconnected through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error during mongoose disconnect:", err);
    process.exit(1);
  }
});
