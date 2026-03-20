import { ProblemDefinition, ProblemTestCase } from '../services/api';

interface ProblemBankPanelProps {
  problems: ProblemDefinition[];
  selectedProblem: ProblemDefinition | null;
  selectedTestCase: ProblemTestCase | null;
  selectedProblemId: string;
  selectedTestCaseId: string;
  loading: boolean;
  error: string;
  onProblemChange: (problemId: string) => void;
  onTestCaseChange: (testCaseId: string) => void;
  onLoadStarter: () => void;
  onUseTestInput: () => void;
  onRunSelectedTest: () => void;
}

const ProblemBankPanel = ({
  problems,
  selectedProblem,
  selectedTestCase,
  selectedProblemId,
  selectedTestCaseId,
  loading,
  error,
  onProblemChange,
  onTestCaseChange,
  onLoadStarter,
  onUseTestInput,
  onRunSelectedTest,
}: ProblemBankPanelProps) => {
  return (
    <section className="panel problem-bank-panel">
      <div className="panel-header">
        <h2>CodeArena Problem Bank</h2>
        <span>{problems.length} problems</span>
      </div>

      <div className="problem-bank-content">
        {loading && <p className="problem-meta">Loading problem bank...</p>}
        {error && <p className="problem-error">{error}</p>}

        {!loading && !error && selectedProblem && (
          <>
            <div className="problem-grid">
              <label className="selector-wrap">
                <span>Question</span>
                <select
                  value={selectedProblemId}
                  onChange={(event) => onProblemChange(event.target.value)}
                >
                  {problems.map((problem) => (
                    <option key={problem.id} value={problem.id}>
                      #{problem.leetCodeNumber} {problem.title} ({problem.difficulty})
                    </option>
                  ))}
                </select>
              </label>

              <label className="selector-wrap">
                <span>Test Case</span>
                <select
                  value={selectedTestCaseId}
                  onChange={(event) => onTestCaseChange(event.target.value)}
                >
                  {selectedProblem.testCases.map((testCase) => (
                    <option key={testCase.id} value={testCase.id}>
                      {testCase.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={onLoadStarter}>
                  Load Starter
                </button>
                <button type="button" className="secondary-button" onClick={onUseTestInput}>
                  Use Test Input
                </button>
                <button type="button" className="secondary-button" onClick={onRunSelectedTest}>
                  Run Test Case
                </button>
              </div>
            </div>

            <div className="problem-details">
              <p className="problem-meta">
                <strong>Summary:</strong> {selectedProblem.summary}
              </p>
              <p className="problem-meta">
                <strong>Input format:</strong> {selectedProblem.inputFormat}
              </p>
              <p className="problem-meta">
                <strong>Output format:</strong> {selectedProblem.outputFormat}
              </p>
              <p className="problem-meta">
                <strong>Source:</strong>{' '}
                <a href={selectedProblem.sourceUrl} target="_blank" rel="noreferrer">
                  leetcode.com/problems/{selectedProblem.id}
                </a>
              </p>

              {selectedTestCase && (
                <div className="testcase-preview">
                  <div>
                    <h3>Test Input</h3>
                    <pre className="console">{selectedTestCase.input}</pre>
                  </div>
                  <div>
                    <h3>Expected Output</h3>
                    <pre className="console">{selectedTestCase.expectedOutput}</pre>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProblemBankPanel;
