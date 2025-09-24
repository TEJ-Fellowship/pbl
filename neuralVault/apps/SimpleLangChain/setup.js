import fs from "fs";
import path from "path";

/**
 * Setup script for SimpleLangChain Demo
 * This helps users get started quickly
 */
class Setup {
  constructor() {
    this.projectRoot = process.cwd();
  }

  async run() {
    console.log("🚀 SimpleLangChain Demo Setup");
    console.log("=".repeat(40));

    // Check if .env exists
    await this.checkEnvironment();

    // Create data directory
    await this.createDataDirectory();

    // Show next steps
    this.showNextSteps();
  }

  async checkEnvironment() {
    console.log("\n📋 Checking environment...");

    const envPath = path.join(this.projectRoot, ".env");

    if (!fs.existsSync(envPath)) {
      console.log("⚠️  .env file not found");
      console.log("📝 Creating .env file from template...");

      const envExample = fs.readFileSync("env.example", "utf8");
      fs.writeFileSync(".env", envExample);

      console.log("✅ .env file created");
      console.log("🔑 Please add your GEMINI_API_KEY to the .env file");
    } else {
      console.log("✅ .env file exists");
    }
  }

  async createDataDirectory() {
    console.log("\n📁 Setting up data directory...");

    const dataPath = path.join(this.projectRoot, "data");

    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
      console.log("✅ Data directory created");
    } else {
      console.log("✅ Data directory exists");
    }

    // Create a sample README in data directory
    const dataReadme = `# Data Directory

Add your PDF files here for the SimpleLangChain demo.

## Supported Files
- PDF files (.pdf)

## How to Use
1. Copy your PDF files to this directory
2. Run the demo with: npm start
3. Ask questions about your documents

## Sample PDFs
You can download sample PDFs from:
- Academic papers
- Technical documentation
- Research reports
- Any text-based PDF documents
`;

    const dataReadmePath = path.join(dataPath, "README.md");
    if (!fs.existsSync(dataReadmePath)) {
      fs.writeFileSync(dataReadmePath, dataReadme);
      console.log("📝 Created data/README.md with instructions");
    }
  }

  showNextSteps() {
    console.log("\n🎯 Next Steps:");
    console.log("=".repeat(40));
    console.log("1. Add your GEMINI_API_KEY to the .env file");
    console.log("2. Add some PDF files to the data/ directory");
    console.log("3. Run the demo: npm start");
    console.log("");
    console.log("📚 The demo will show you:");
    console.log("   • How to load PDF documents");
    console.log("   • Text chunking and embeddings");
    console.log("   • Vector storage and search");
    console.log("   • RAG (Retrieval-Augmented Generation)");
    console.log("");
    console.log("🚀 Ready to learn LangChain!");
  }
}

// Run setup
const setup = new Setup();
setup.run().catch(console.error);
