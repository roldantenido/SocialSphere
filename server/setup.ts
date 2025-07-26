import fs from 'fs';
import path from 'path';
import type { SetupData, SetupStatus } from '@shared/setup';

const CONFIG_FILE = path.join(process.cwd(), '.app-config.json');

export interface AppConfig {
  siteName: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  isSetup: boolean;
}

export function isAppConfigured(): boolean {
  try {
    // If DATABASE_URL is set in environment, consider it configured
    if (process.env.DATABASE_URL) {
      return true;
    }
    
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as AppConfig;
      return config.isSetup === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking app configuration:', error);
    return false;
  }
}

export function getAppConfig(): AppConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as AppConfig;
    }
    return null;
  } catch (error) {
    console.error('Error reading app configuration:', error);
    return null;
  }
}

export function saveAppConfig(setupData: SetupData): void {
  const config: AppConfig = {
    siteName: setupData.siteName,
    database: {
      host: setupData.dbHost,
      port: setupData.dbPort,
      name: setupData.dbName,
      user: setupData.dbUser,
      password: setupData.dbPassword,
    },
    isSetup: true,
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  // Update environment variables
  process.env.DATABASE_URL = `postgresql://${setupData.dbUser}:${setupData.dbPassword}@${setupData.dbHost}:${setupData.dbPort}/${setupData.dbName}`;
  
  console.log('✅ App configuration saved');
}

export function getSetupStatus(): SetupStatus {
  const config = getAppConfig();
  return {
    isConfigured: isAppConfigured(),
    siteName: config?.siteName,
  };
}