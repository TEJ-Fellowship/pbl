/**
 * Vector utility functions
 */

/**
 * Resize 768-dimension vector to 1024-dimension for Pinecone
 */
function resizeVector768to1024(vector768) {
  const vector1024 = [...vector768];
  const extra = 1024 - 768;
  for (let i = 0; i < extra; i++) {
    const scale = 0.1 + (i % 10) * 0.01;
    const sourceIndex = i % 768;
    vector1024.push(vector768[sourceIndex] * scale);
  }
  return vector1024;
}

module.exports = { resizeVector768to1024 };
