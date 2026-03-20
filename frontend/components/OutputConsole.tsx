import { ExecuteResponse } from '../services/api';

interface OutputConsoleProps {
  result: ExecuteResponse | null;
  error: string;
}

const OutputConsole = ({ result, error }: OutputConsoleProps) => {
  if (error) {
    return (
      <div className="panel output-panel">
        <div className="panel-header">
          <h2>Output</h2>
        </div>
        <pre className="console console-error">{error}</pre>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="panel output-panel">
        <div className="panel-header">
          <h2>Output</h2>
        </div>
        <pre className="console">Run your code to see output here.</pre>
      </div>
    );
  }

  return (
    <div className="panel output-panel">
      <div className="panel-header">
        <h2>Output</h2>
        <div className="status-wrap">
          <span className={`status-badge status-${result.status}`}>{result.status}</span>
          <span>{result.executionTimeMs} ms</span>
        </div>
      </div>
      <div className="output-blocks">
        <div>
          <h3>stdout</h3>
          <pre className="console">{result.stdout || '(empty)'}</pre>
        </div>
        <div>
          <h3>stderr</h3>
          <pre className="console console-error">{result.stderr || '(empty)'}</pre>
        </div>
      </div>
    </div>
  );
};

export default OutputConsole;
