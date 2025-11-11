import { getLearningSystemDir } from '@vibetech/shared-config';
import { spawn } from 'child_process';
import { resolve } from 'path';

export type PythonAdapterCommand =
    | 'error_prevention'
    | 'performance_optimize'
    | 'pattern_recognition'
    | 'batch_optimize';

export interface PythonAdapterOptions {
    timeoutMs?: number;
    pythonPath?: string;
    module?: string; // optional override
}

export interface PythonAdapterResult<T = any> {
    success: boolean;
    result?: T;
    error?: string;
    stderr?: string;
    durationMs: number;
}

function buildModulePath(cmd: PythonAdapterCommand): string {
    const base = getLearningSystemDir();
    // Conventional module locations; allow overrides via options.module
    switch (cmd) {
        case 'error_prevention':
            return resolve(base, 'error_prevention_utils.py');
        case 'performance_optimize':
            return resolve(base, 'performance_optimization.py');
        case 'pattern_recognition':
            return resolve(base, 'pattern_recognition.py');
        case 'batch_optimize':
            return resolve(base, 'batch_optimization.py');
    }
}

export async function callPythonModule<T = any>(
    command: PythonAdapterCommand,
    payload: Record<string, any>,
    options: PythonAdapterOptions = {}
): Promise<PythonAdapterResult<T>> {
    const startedAt = Date.now();
    const timeoutMs = Math.max(1000, options.timeoutMs ?? 5000);
    const pythonPath = options.pythonPath || 'python';
    const modulePath = options.module || buildModulePath(command);

    return new Promise<PythonAdapterResult<T>>((resolve) => {
        const child = spawn(pythonPath, [modulePath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });

        let stdout = '';
        let stderr = '';
        let finished = false;

        const timeout = setTimeout(() => {
            if (!finished) {
                finished = true;
                try {
                    child.kill('SIGKILL');
                } catch { }
                resolve({
                    success: false,
                    error: `Python adapter timeout after ${timeoutMs}ms`,
                    stderr,
                    durationMs: Date.now() - startedAt,
                });
            }
        }, timeoutMs);

        child.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
        });
        child.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
        });
        child.on('error', (err) => {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            resolve({
                success: false,
                error: `Failed to start python process: ${err.message}`,
                stderr,
                durationMs: Date.now() - startedAt,
            });
        });
        child.on('exit', () => {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            try {
                // Expect JSON on stdout
                const parsed = JSON.parse(stdout || '{}');
                resolve({
                    success: true,
                    result: parsed as T,
                    durationMs: Date.now() - startedAt,
                });
            } catch (e: any) {
                resolve({
                    success: false,
                    error: `Invalid JSON from python module: ${e.message}`,
                    stderr,
                    durationMs: Date.now() - startedAt,
                });
            }
        });

        // Send payload to stdin as JSON
        try {
            child.stdin.write(JSON.stringify({ command, payload }));
            child.stdin.end();
        } catch (e: any) {
            // If writing fails, rely on 'error'/'exit' handlers
        }
    });
}

export async function applyErrorPrevention(input: Record<string, any>, options?: PythonAdapterOptions) {
    return callPythonModule('error_prevention', input, options);
}

export async function optimizePerformance(input: Record<string, any>, options?: PythonAdapterOptions) {
    return callPythonModule('performance_optimize', input, options);
}

export async function recognizePatterns(input: Record<string, any>, options?: PythonAdapterOptions) {
    return callPythonModule('pattern_recognition', input, options);
}

export async function optimizeBatch(input: Record<string, any>, options?: PythonAdapterOptions) {
    return callPythonModule('batch_optimize', input, options);
}
