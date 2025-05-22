import { openArchive, getPrimaryModelPath } from './opc';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Simple test function for the OPC module
 */
async function testOpcModule(filePath: string) {
  try {
    console.log(`Testing OPC module with file: ${filePath}`);
    
    // Open the archive
    const zip = await openArchive(filePath);
    console.log('Archive opened successfully');
    
    // Try to get the primary model path
    const primaryModelPath = await getPrimaryModelPath(zip);
    console.log(`Primary model path: ${primaryModelPath}`);
    
    // Print all files in the archive
    const fileNames = Object.keys(zip.files);
    console.log('Files in archive:');
    fileNames.forEach(name => console.log(`- ${name}`));
    
    return { success: true, primaryModelPath };
  } catch (error) {
    console.error('Error testing OPC module:', error);
    return { success: false, error };
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  // Check if a file path was provided
  const args = process.argv.slice(2);
  const filePath = args[0] || './test-files/sample.3mf';
  
  testOpcModule(filePath)
    .then(result => {
      if (result.success) {
        console.log('Test completed successfully!');
      } else {
        console.error('Test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export { testOpcModule }; 