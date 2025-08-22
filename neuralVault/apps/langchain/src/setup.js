import { FileUtils } from "./utils/fileUtils.js";
import { logger } from "./utils/logger.js";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";

const setupApp = async () => {
  logger.info("🔧 Setting up LangChain Data Ingestion App...");

  try {
    // Create necessary directories
    const directories = [
      "./docs",
      "./src/data/documents",
      "./src/data/processed",
      "./src/data/vectors",
    ];

    for (const dir of directories) {
      await FileUtils.ensureDirectoryExists(dir);
    }

    logger.success("✅ Directories created successfully");

    // Create sample PDF if it doesn't exist
    const samplePdfPath = "./docs/sample_langchain_doc.pdf";
    const pdfExists = await FileUtils.fileExists(samplePdfPath);

    if (!pdfExists) {
      logger.warn(
        "⚠️  Sample PDF not found. Please add a PDF file to ./docs/sample_langchain_doc.pdf"
      );
      logger.info(
        "You can download a sample PDF from the LangChain documentation or use any PDF file for testing."
      );
    } else {
      logger.success("✅ Sample PDF found");
    }

    // Create .env file if it doesn't exist
    const envPath = "./.env";
    const envExists = await FileUtils.fileExists(envPath);

    if (!envExists) {
      logger.warn(
        "⚠️  .env file not found. Please create one based on env.example"
      );
      logger.info("Copy env.example to .env and add your GEMINI_API_KEY");
    } else {
      logger.success("✅ .env file found");
    }

    // Check dependencies
    logger.info("📦 Checking dependencies...");
    const packageJson = await FileUtils.loadJson("./package.json");
    const requiredDeps = [
      "@langchain/community",
      "@langchain/google-genai",
      "@langchain/core",
      "langchain",
      "dotenv",
      "chalk",
    ];

    const missingDeps = requiredDeps.filter(
      (dep) =>
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length > 0) {
      logger.warn(`⚠️  Missing dependencies: ${missingDeps.join(", ")}`);
      logger.info("Run: pnpm install to install dependencies");
    } else {
      logger.success("✅ All dependencies are installed");
    }

    // Create README if it doesn't exist
    const readmePath = "./docs/README.md";
    const readmeExists = await FileUtils.fileExists(readmePath);

    if (!readmeExists) {
      const readmeContent = `# LangChain Data Ingestion App

This is a comprehensive data ingestion and chat application built with LangChain and Google's Gemini AI.

## Features

- **Document Processing**: Load and process PDF and text documents
- **Vector Storage**: Store document embeddings in memory vector store
- **Similarity Search**: Search through documents using semantic similarity
- **Retrieval-Augmented Chat**: Chat with AI using document context
- **Interactive Interface**: Command-line chat interface

## Setup

1. Copy \`env.example\` to \`.env\`
2. Add your Gemini API key to \`.env\`
3. Place a PDF file in \`./docs/sample_langchain_doc.pdf\`
4. Run \`pnpm install\` to install dependencies

## Usage

- \`pnpm start\`: Start the interactive chat application
- \`pnpm test\`: Run tests
- \`pnpm ingest\`: Run document ingestion only

## Configuration

Edit \`.env\` file to configure:
- Gemini API settings
- Document processing parameters
- Application behavior

## Architecture

The app follows a modular architecture:
- **Config**: Environment and application configuration
- **Ingestion**: Document loading and processing
- **Storage**: Vector store management
- **Retrieval**: Document search and retrieval
- **Chat**: AI chat interface with retrieval
- **Utils**: Logging and file utilities
`;

      await FileUtils.writeFile(readmePath, readmeContent);
      logger.success("✅ README created");
    }

    logger.success("🎉 Setup completed successfully!");
    logger.info("Next steps:");
    logger.info("1. Add your GEMINI_API_KEY to .env file");
    logger.info("2. Place a PDF file in ./docs/sample_langchain_doc.pdf");
    logger.info("3. Run: pnpm start");
  } catch (error) {
    logger.error("❌ Setup failed:", error);
  }
};

// Run setup
setupApp().catch(console.error);
