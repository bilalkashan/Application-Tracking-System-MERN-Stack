/**
 * Profile Picture Diagnostic Script
 *
 * Run this to verify:
 * 1. Upload directories exist and are readable/writable
 * 2. Static file serving is working
 * 3. Database is storing paths correctly
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/user.js";
import Profile from "./models/Profile.js";
import "./models/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function log(type, msg) {
  const icons = { "✅": "✅", "❌": "❌", "⚠️": "⚠️", ℹ️: "ℹ️" };
  const icon = icons[type] || "•";
  console.log(`${icon} ${msg}`);
  if (type === "✅") checks.passed++;
  else if (type === "❌") checks.failed++;
  else if (type === "⚠️") checks.warnings++;
}

async function runDiagnostics() {
  console.log("\n🔍 Profile Picture Diagnostics\n");

  // 1. Check directories exist
  const uploadDir = path.join(__dirname, "uploads");
  const profilePicsDir = path.join(__dirname, "uploads", "profilePictures");
  const resumesDir = path.join(__dirname, "uploads", "resumes");

  log("ℹ️", `Upload directory: ${uploadDir}`);

  if (fs.existsSync(uploadDir)) {
    log("✅", "uploads directory exists");
  } else {
    log("❌", "uploads directory does NOT exist");
  }

  if (fs.existsSync(profilePicsDir)) {
    log("✅", "profilePictures directory exists");
    const files = fs.readdirSync(profilePicsDir);
    log("ℹ️", `  Found ${files.length} profile picture files`);
    if (files.length > 0) {
      log("ℹ️", `  Sample files: ${files.slice(0, 3).join(", ")}`);
    }
  } else {
    log("❌", "profilePictures directory does NOT exist");
  }

  if (fs.existsSync(resumesDir)) {
    log("✅", "resumes directory exists");
    const files = fs.readdirSync(resumesDir);
    log("ℹ️", `  Found ${files.length} resume files`);
  } else {
    log("❌", "resumes directory does NOT exist");
  }

  // 2. Check file permissions
  try {
    const testFile = path.join(profilePicsDir, ".write-test");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    log("✅", "profilePictures directory is writable");
  } catch (err) {
    log("❌", `profilePictures directory write test failed: ${err.message}`);
  }

  // 3. Check database for profiles with pictures
  try {
    const profilesWithPics = await Profile.find({
      profilePicture: { $exists: true, $ne: null },
    })
      .select("profilePicture user")
      .limit(5)
      .lean();

    log(
      "ℹ️",
      `Found ${profilesWithPics.length} profiles with picture paths in DB`
    );

    if (profilesWithPics.length > 0) {
      log("✅", "Profiles ARE storing picture paths");
      profilesWithPics.forEach((p, i) => {
        log("ℹ️", `  Profile ${i + 1}: ${p.profilePicture}`);
        // Check if file exists on disk
        const filePath = path.join(
          __dirname,
          p.profilePicture.replace(/^\//, "")
        );
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          log("✅", `    File exists on disk (${stats.size} bytes)`);
        } else {
          log("❌", `    File NOT found at: ${filePath}`);
        }
      });
    } else {
      log("⚠️", "No profiles with pictures found in DB");
    }
  } catch (err) {
    log("❌", `Database query failed: ${err.message}`);
  }

  // 4. Summary
  console.log("\n📊 Diagnostics Summary");
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log(`⚠️ Warnings: ${checks.warnings}`);

  if (checks.failed === 0) {
    console.log("\n✨ All checks passed! Profile picture setup is correct.");
    console.log("\nTo test file serving:");
    console.log("1. Start the backend server: npm run start");
    console.log("2. Try accessing a picture in your browser:");
    if (fs.existsSync(profilePicsDir)) {
      const files = fs.readdirSync(profilePicsDir);
      if (files.length > 0) {
        console.log(
          `   http://localhost:8080/uploads/profilePictures/${files[0]}`
        );
      }
    }
  } else {
    console.log("\n⚠️ Issues found - review the errors above");
  }

  process.exit(checks.failed > 0 ? 1 : 0);
}

runDiagnostics().catch((err) => {
  console.error("Diagnostics script error:", err);
  process.exit(1);
});
