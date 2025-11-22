/**
 * Cleanup broken profilePicture paths from database
 * Run this once to fix all profiles that have non-existent picture paths
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import "./models/db.js";
import Profile from "./models/Profile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanup() {
  console.log("\n🧹 Cleaning up broken profilePicture paths...\n");

  try {
    const profiles = await Profile.find({
      profilePicture: { $exists: true, $ne: null },
    });

    let fixed = 0;
    let errors = 0;

    for (const profile of profiles) {
      const picPath = path.join(
        __dirname,
        profile.profilePicture.replace(/^\//, "")
      );

      if (!fs.existsSync(picPath)) {
        console.log(`❌ Missing: ${profile.profilePicture}`);
        profile.profilePicture = null;
        await profile.save();
        fixed++;
      } else {
        console.log(`✅ OK: ${profile.profilePicture}`);
      }
    }

    console.log(`\n✨ Cleanup complete:`);
    console.log(`  - Fixed ${fixed} profiles with missing pictures`);
    console.log(
      `  - Kept ${profiles.length - fixed} profiles with valid pictures`
    );

    process.exit(0);
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
    process.exit(1);
  }
}

cleanup();
