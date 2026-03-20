import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { saveSubmission } from './submissionService';
import { config } from '../utils/config';
import { ExecuteRequest, ExecuteResponse, ExecutionStatus, SupportedLanguage } from '../utils/types';
import { HttpError } from '../utils/httpError';

interface LanguageConfig {
  image: string;
  extension: string;
  command: string[];
}

const languageConfig: Record<SupportedLanguage, LanguageConfig> = {
  python: {
    image: 'python:3.9',
    extension: 'py',
    command: ['python', '/workspace/main.py'],
  },
  javascript: {
    image: 'node:18',
    extension: 'js',
    command: ['node', '/workspace/main.js'],
  },
  c: {
    image: 'gcc:12',
    extension: 'c',
    command: [
      'sh',
      '-lc',
      'gcc -std=c11 -O2 -pipe /workspace/main.c -o /workspace/program && /workspace/program',
    ],
  },
  cpp: {
    image: 'gcc:12',
    extension: 'cpp',
    command: [
      'sh',
      '-lc',
      'g++ -std=c++17 -O2 -pipe /workspace/main.cpp -o /workspace/program && /workspace/program',
    ],
  },
};

interface DockerExecutionResult {
  stdout: string;
  stderr: string;
  status: ExecutionStatus;
  truncated: boolean;
}

const stopAndRemoveContainer = (containerName: string): void => {
  const kill = spawn('docker', ['rm', '-f', containerName], {
    stdio: 'ignore',
  });
  kill.on('error', () => undefined);
  kill.unref();
};

const runDockerExecution = async (
  args: string[],
  containerName: string,
  stdin: string,
): Promise<DockerExecutionResult> => {
  return new Promise((resolve, reject) => {
    const processRef = spawn('docker', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let outputSize = 0;
    let truncated = false;
    let terminatedBy: 'timeout' | 'output' | null = null;

    const finish = (status: ExecutionStatus, code?: number | null): void => {
      if (status === 'runtime_error' && code === 137 && !terminatedBy) {
        resolve({
          stdout,
          stderr: stderr || 'Execution killed by Docker (possible resource limit breach).',
          status,
          truncated,
        });
        return;
      }

      resolve({
        stdout,
        stderr,
        status,
        truncated,
      });
    };

    const safeKill = (): void => {
      processRef.kill('SIGKILL');
      stopAndRemoveContainer(containerName);
    };

    const timeout = setTimeout(() => {
      terminatedBy = 'timeout';
      safeKill();
    }, config.executionTimeoutMs);

    const pushOutput = (chunk: Buffer, stream: 'stdout' | 'stderr'): void => {
      if (outputSize >= config.maxOutputSize) {
        return;
      }

      const remaining = config.maxOutputSize - outputSize;
      const sliced = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
      outputSize += sliced.length;

      const text = sliced.toString('utf8');
      if (stream === 'stdout') {
        stdout += text;
      } else {
        stderr += text;
      }

      if (chunk.length > remaining && !terminatedBy) {
        truncated = true;
        terminatedBy = 'output';
        stderr += '\nExecution stopped: output exceeded safe limit.';
        safeKill();
      }
    };

    processRef.stdout.on('data', (chunk: Buffer) => pushOutput(chunk, 'stdout'));
    processRef.stderr.on('data', (chunk: Buffer) => pushOutput(chunk, 'stderr'));

    processRef.on('error', (error) => {
      clearTimeout(timeout);
      stopAndRemoveContainer(containerName);

      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new HttpError(500, 'Docker is not installed or not available in PATH.'));
        return;
      }

      reject(new HttpError(500, `Failed to start Docker process: ${error.message}`));
    });

    processRef.on('close', (code) => {
      clearTimeout(timeout);

      if (terminatedBy === 'timeout') {
        finish('timeout', code);
        return;
      }

      if (terminatedBy === 'output') {
        finish('output_limit_exceeded', code);
        return;
      }

      if (code === 0) {
        finish('success', code);
        return;
      }

      finish('runtime_error', code);
    });

    if (stdin) {
      processRef.stdin.write(stdin);
    }
    processRef.stdin.end();
  });
};

export const executeCode = async (
  request: ExecuteRequest,
  userId: number,
): Promise<ExecuteResponse> => {
  const { language, code, stdin } = request;
  const lang = languageConfig[language];

  if (!lang) {
    throw new HttpError(400, `Unsupported language: ${language}`);
  }

  const startedAt = Date.now();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-exec-'));
  const tempFile = path.join(tempDir, `main.${lang.extension}`);
  const containerName = `code-exec-${randomUUID().replace(/-/g, '').slice(0, 24)}`;

  try {
    await fs.writeFile(tempFile, code, { encoding: 'utf8', mode: 0o644 });

    const dockerArgs = [
      'run',
      '--rm',
      '-i',
      '--name',
      containerName,
      '--network',
      'none',
      '--cpus',
      config.dockerCpuLimit,
      '--memory',
      config.dockerMemoryLimit,
      '--pids-limit',
      '64',
      '--read-only',
      '--tmpfs',
      '/tmp:rw,noexec,nosuid,size=64m',
      '--tmpfs',
      '/workspace:rw,exec,nosuid,nodev,size=64m',
      '--security-opt',
      'no-new-privileges',
      '--cap-drop',
      'ALL',
      '--ulimit',
      'nproc=64:64',
      '-v',
      `${tempFile}:/workspace/main.${lang.extension}:ro`,
      '-w',
      '/workspace',
      lang.image,
      ...lang.command,
    ];

    const execResult = await runDockerExecution(dockerArgs, containerName, stdin);
    const executionTimeMs = Date.now() - startedAt;

    await saveSubmission({
      userId,
      code,
      language,
      input: stdin,
      output: `STDOUT:\n${execResult.stdout}\n\nSTDERR:\n${execResult.stderr}`,
      status: execResult.status,
    });

    return {
      ...execResult,
      executionTimeMs,
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startedAt;

    if (error instanceof HttpError) {
      await saveSubmission({
        userId,
        code,
        language,
        input: stdin,
        output: error.message,
        status: 'internal_error',
      });

      return {
        stdout: '',
        stderr: error.message,
        status: 'internal_error',
        executionTimeMs,
        truncated: false,
      };
    }

    const message = error instanceof Error ? error.message : 'Unknown execution failure';
    await saveSubmission({
      userId,
      code,
      language,
      input: stdin,
      output: message,
      status: 'internal_error',
    });

    return {
      stdout: '',
      stderr: message,
      status: 'internal_error',
      executionTimeMs,
      truncated: false,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};
