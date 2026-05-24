const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.join(__dirname, "opencode.db");
const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error("Error:", err);
    process.exit(1);
  }

  try {
    // Hash the password
    const hash = await bcrypt.hash("6715320", 12);

    // Insert the user
    db.run(
      "INSERT OR REPLACE INTO users (email, username, password) VALUES (?, ?, ?)",
      ["daveymena16@gmail.com", "duvier", hash],
      function (err) {
        if (err) {
          console.error("Error inserting user:", err);
        } else {
          console.log("✅ Usuario insertado correctamente");
          console.log("Email: daveymena16@gmail.com");
          console.log("Username: duvier");
          console.log("Password: 6715320");
        }
        db.close();
        process.exit(0);
      }
    );
  } catch (err) {
    console.error("Error:", err);
    db.close();
    process.exit(1);
  }
});
