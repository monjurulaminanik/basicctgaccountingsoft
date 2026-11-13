import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const [email, password, name = "System Admin"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: npm run seed -- admin@company.com StrongPassword123 'Admin Name'");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing. Create .env.local first.");
  process.exit(1);
}

const connection = await mongoose.connect(process.env.MONGODB_URI, { dbName: "party_accounts_db" });
const User = connection.models.User || connection.model("User", new mongoose.Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: String, active: Boolean }, { timestamps: true }));
const passwordHash = await bcrypt.hash(password, 12);
await User.findOneAndUpdate({ email: email.toLowerCase() }, { name, email: email.toLowerCase(), passwordHash, role: "ADMIN", active: true }, { upsert: true, new: true });
console.log(`Admin account ready: ${email}`);
await mongoose.disconnect();
