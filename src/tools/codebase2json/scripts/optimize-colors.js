#!/usr/bin/env node

/**
 * Script to optimize colors.json file
 * Removes unnecessary data like URLs and keeps only language names and colors
 */

import fs from 'fs';
import path from 'path';

// Paths
const inputPath = path.join(__dirname, '../workers/colors.json');
const outputPath = path.join(__dirname, '../workers/colors-optimized.json');

console.log('🔄 Optimizing colors.json...');

try {
  // Read the original colors.json
  const originalData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  // Create optimized version - only keep language name and color
  const optimizedData = {};
  let totalLanguages = 0;
  let languagesWithColors = 0;
  
  for (const [language, data] of Object.entries(originalData)) {
    totalLanguages++;
    
    // Only include languages that have a color defined
    if (data && data.color) {
      optimizedData[language] = data.color;
      languagesWithColors++;
    }
  }
  
  // Write optimized file
  fs.writeFileSync(outputPath, JSON.stringify(optimizedData, null, 2));
  
  // Calculate file size reduction
  const originalSize = fs.statSync(inputPath).size;
  const optimizedSize = fs.statSync(outputPath).size;
  const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
  
  console.log('✅ Optimization complete!');
  console.log(`📊 Statistics:`);
  console.log(`   - Total languages: ${totalLanguages}`);
  console.log(`   - Languages with colors: ${languagesWithColors}`);
  console.log(`   - Original size: ${(originalSize / 1024).toFixed(1)} KB`);
  console.log(`   - Optimized size: ${(optimizedSize / 1024).toFixed(1)} KB`);
  console.log(`   - Size reduction: ${reduction}%`);
  console.log(`📁 Output: ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error optimizing colors.json:', error.message);
  process.exit(1);
}