import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

type Protocol = 'tcp' | 'udp';

interface ExecResult {
  stdout: string;
  stderr: string;
}

export default function killProcessOnPort(port: number | string, method: Protocol = 'tcp'): Promise<ExecResult> {
  const parsedPort = Number.parseInt(String(port));

  if (!parsedPort) {
    return Promise.reject(new Error('Invalid argument provided for port'));
  }

  if (process.platform === 'win32') {
    return execAsync('netstat -nao')
      .then((res: ExecResult) => {
        const { stdout } = res;
        if (!stdout) {
          return res;
        }

        const lines = stdout.split('\n');
        // The second white-space delimited column of netstat output is the local port,
        // which is the only port we care about.
        // The regex here will match only the local port column of the output
        const lineWithLocalPortRegEx = new RegExp(`^ *${method.toUpperCase()} *[^ ]*:${parsedPort}`, 'gm');
        const linesWithLocalPort = lines.filter(line => line.match(lineWithLocalPortRegEx));

        const pids = linesWithLocalPort.reduce<string[]>((acc, line) => {
          const match = line.match(/(\d+)(?:\s|$)/);
          if (match && match[1] && !acc.includes(match[1])) {
            return acc.concat(match[1]);
          }
          return acc;
        }, []);

        return execAsync(`TaskKill /F /PID ${pids.join(' /PID ')}`);
      });
  }

  return execAsync(
    `lsof -i ${method === 'udp' ? 'udp' : 'tcp'}:${parsedPort} | grep ${method === 'udp' ? 'UDP' : 'LISTEN'} | awk '{print $2}' | xargs kill -9`,
  );
}
