/**
 * Quick script to check what profilePicture paths are stored in DB
 */
import "./models/db.js";
import Profile from "./models/Profile.js";

async function check() {
  try {
    const profiles = await Profile.find({
      profilePicture: { $exists: true, $ne: null },
    })
      .select("profilePicture user")
      .limit(5);

    console.log(`\n📸 Found ${profiles.length} profiles with pictures:\n`);
    profiles.forEach((p, i) => {
      console.log(`${i + 1}. User ${p.user}:`);
      console.log(`   Path in DB: ${p.profilePicture}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();
