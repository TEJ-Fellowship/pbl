import bcrypt from "bcryptjs";

class passwordUtils {
  static async hash(password) {
    return await bcrypt.hash(password, 10);
  }

  static async compare(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export default passwordUtils;
