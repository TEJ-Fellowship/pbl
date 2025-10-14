// Environment variable validation
export const validateEnv = () => {
  const requiredEnvVars = [
    "MONGO_URI",
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
    "GOOGLE_GEMINI_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "\n💡 Please create a .env file with the required variables."
    );
    process.exit(1);
  }

  console.log("✅ All required environment variables are set");
};
