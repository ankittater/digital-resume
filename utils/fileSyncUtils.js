import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RESUME_DATA_PATH } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the resources directory resume-data.json
const RESOURCES_RESUME_DATA_PATH = path.join(__dirname, '..', 'resources', 'resume-data.json');

/**
 * Synchronize resume data between config and resources directories
 * This ensures that regardless of which file is edited, the system uses the config version
 * @returns {boolean} Success status
 */
export async function synchronizeResumeData() {
  try {
    console.log('Synchronizing resume data files...');

    // Check if config file exists
    if (!fs.existsSync(RESUME_DATA_PATH)) {
      // If config file doesn't exist but resources file does, copy from resources to config
      if (fs.existsSync(RESOURCES_RESUME_DATA_PATH)) {
        console.log(`Config file doesn't exist. Copying from resources to config directory...`);
        fs.copyFileSync(RESOURCES_RESUME_DATA_PATH, RESUME_DATA_PATH);
        console.log(`Resources file copied to config directory.`);
      } else {
        console.error('Resume data not found in either location!');
        return false;
      }
    } else {
      // Config file exists, make sure resources file is updated
      console.log(`Copying from config to resources directory...`);
      
      // Ensure resources directory exists
      const resourcesDir = path.dirname(RESOURCES_RESUME_DATA_PATH);
      if (!fs.existsSync(resourcesDir)) {
        fs.mkdirSync(resourcesDir, { recursive: true });
      }
      
      // Copy from config to resources
      fs.copyFileSync(RESUME_DATA_PATH, RESOURCES_RESUME_DATA_PATH);
      console.log(`Config file copied to resources directory.`);
    }

    return true;
  } catch (error) {
    console.error('Error synchronizing resume data files:', error);
    return false;
  }
}