import { spawn } from 'node:child_process';
import { join } from 'path';

interface PreprocessResult {
  image_base64: string;
  is_photo_of_screen: boolean;
  dimensions: { width: number; height: number };
}

export function preprocessImage(imageBase64: string): Promise<PreprocessResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, 'preprocessor.py');
    const child = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', () => {
      resolve({
        image_base64: imageBase64,
        is_photo_of_screen: false,
        dimensions: { width: 0, height: 0 },
      });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        resolve({
          image_base64: imageBase64,
          is_photo_of_screen: false,
          dimensions: { width: 0, height: 0 },
        });
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.error) {
          resolve({
            image_base64: imageBase64,
            is_photo_of_screen: false,
            dimensions: { width: 0, height: 0 },
          });
          return;
        }
        resolve(parsed as PreprocessResult);
      } catch {
        resolve({
          image_base64: imageBase64,
          is_photo_of_screen: false,
          dimensions: { width: 0, height: 0 },
        });
      }
    });

    child.stdin.write(JSON.stringify({ image_base64: imageBase64 }));
    child.stdin.end();
  });
}

export function preprocessImageSyncFallback(imageBase64: string): PreprocessResult {
  return {
    image_base64: imageBase64,
    is_photo_of_screen: false,
    dimensions: { width: 0, height: 0 },
  };
}
