import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

async function generate() {
  console.log('🔄 Generating API types from OpenAPI spec...');

  const inputPath = join(__dirname, '../src/lib/api/openapi.json');
  const outputPath = join(__dirname, '../src/lib/api/types.ts');

  try {
    // Check if input file exists
    if (!existsSync(inputPath)) {
      throw new Error(`OpenAPI spec not found at ${inputPath}`);
    }

    // Generate TypeScript types using CLI
    execSync(
      `npx openapi-typescript ${inputPath} -o ${outputPath}`,
      { stdio: 'inherit' }
    );

    console.log('✅ API types generated successfully!');
    console.log(`   Input:  ${inputPath}`);
    console.log(`   Output: ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate API types:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend is running (pnpm dev:backend)');
    console.log('   2. OpenAPI spec exists at src/lib/api/openapi.json');
    console.log('   3. Backend generated the spec in development mode');
    process.exit(1);
  }
}

generate();
