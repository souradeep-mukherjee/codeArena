import { spawn } from 'child_process';

export const checkDockerAvailability = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const check = spawn('docker', ['--version'], {
      stdio: 'ignore',
    });

    const timer = setTimeout(() => {
      check.kill('SIGKILL');
      resolve(false);
    }, 1200);

    check.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });

    check.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
};
