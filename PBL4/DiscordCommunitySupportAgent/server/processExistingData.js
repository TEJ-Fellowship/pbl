#!/usr/bin/env node

/**
 * Process existing raw data into proper chunks for RAG
 * This script processes the existing text files and JSON data
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import TextSplitter from './src/utils/textSplitter.js';
import EmbeddingService from './src/services/embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processExistingData() {
  try {
    console.log('🔄 Processing existing raw data...');
    
    // Initialize services
    const textSplitter = new TextSplitter();
    const embeddingService = new EmbeddingService();
    await embeddingService.initialize();
    
    const allDocuments = [];
    
    // Process text files
    const textFiles = [
      '206029707.txt', // Permissions guide
      '228383668.txt', // Another guide
      '360045138571.txt', // Another guide
      'guidelines.txt', // Community guidelines
      'intro.txt', // Introduction
      'oauth2.txt', // OAuth2 and bot info
      'webhook.txt' // Webhook info
    ];
    
    for (const file of textFiles) {
      const filePath = path.join(__dirname, 'data/raw', file);
      if (await fs.pathExists(filePath)) {
        console.log(`📄 Processing ${file}...`);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Clean up content
        const cleanContent = content
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanContent.length > 100) { // Only process substantial content
          allDocuments.push({
            title: file.replace('.txt', ''),
            content: cleanContent,
            url: `file://${file}`,
            source: 'Discord Documentation'
          });
        }
      }
    }
    
    // Process JSON data
    const jsonFiles = ['discord_support.json'];
    for (const file of jsonFiles) {
      const filePath = path.join(__dirname, 'data/raw', file);
      if (await fs.pathExists(filePath)) {
        console.log(`📄 Processing ${file}...`);
        const data = await fs.readJson(filePath);
        
        if (Array.isArray(data)) {
          data.forEach((item, index) => {
            if (item.content && item.content.length > 100) {
              allDocuments.push({
                title: item.title || `Document ${index}`,
                content: item.content.replace(/\s+/g, ' ').trim(),
                url: item.url || `json://${file}#${index}`,
                source: 'Discord Support'
              });
            }
          });
        }
      }
    }
    
    console.log(`✅ Found ${allDocuments.length} documents to process`);
    
    // Process documents into chunks
    console.log('✂️ Splitting documents into chunks...');
    const processedChunks = await embeddingService.processDocuments(allDocuments);
    
    console.log(`✅ Created ${processedChunks.length} chunks`);
    
    // Generate stats
    const stats = await embeddingService.getEmbeddingStats(processedChunks);
    console.log('📊 Processing Statistics:');
    console.log(stats);
    
    // Save processed data
    await fs.ensureDir('./data/processed');
    await fs.writeJson('./data/processed/discord_chunks.json', processedChunks, { spaces: 2 });
    await fs.writeJson('./data/processed/stats.json', stats, { spaces: 2 });
    
    console.log('💾 Processed data saved to ./data/processed/');
    console.log('🎉 Data processing complete!');
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
  }
}

// Run the processing
processExistingData();
