import { createEmbeddings } from './src/config/embeddings.js';

async function testEmbeddings() {
  console.log('🔍 Testing Embeddings API...');
  
  try {
    const embeddings = createEmbeddings();
    
    // Test with a simple query
    console.log('📝 Testing with query: "test"');
    const result = await embeddings.embedQuery("test");
    
    console.log('✅ Embeddings API working!');
    console.log(`📊 Vector dimension: ${result.length}`);
    console.log(`📊 First 5 values: [${result.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    return true;
  } catch (error) {
    console.log('❌ Embeddings API failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run the test
testEmbeddings().then(success => {
  process.exit(success ? 0 : 1);
});
