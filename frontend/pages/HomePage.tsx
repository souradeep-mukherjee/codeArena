import { useEffect, useMemo, useState } from 'react';
import CodeEditorPanel from '../components/CodeEditorPanel';
import LanguageSelector from '../components/LanguageSelector';
import OutputConsole from '../components/OutputConsole';
import ProblemBankPanel from '../components/ProblemBankPanel';
import {
  ExecuteResponse,
  ProblemDefinition,
  SupportedLanguage,
  executeCode,
  getProblemBank,
} from '../services/api';

const templates: Record<SupportedLanguage, string> = {
  python: `# Python 3.9\nname = input().strip()\nprint(f"Hello, {name}!")`,
  javascript: `// Node 18\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nconsole.log(\`Hello, \${input}!\`);`,
  c: `#include <stdio.h>

int main(void) {
  char name[256];
  if (scanf("%255s", name) != 1) {
    return 0;
  }

  printf("Hello, %s!\\n", name);
  return 0;
}`,
  cpp: `#include <iostream>
#include <string>

int main() {
  std::string name;
  if (!(std::cin >> name)) {
    return 0;
  }

  std::cout << "Hello, " << name << "!\\n";
  return 0;
}`,
};

const flattenForComment = (value: string): string => value.replace(/\s+/g, ' ').trim();

const buildStarterTemplate = (language: SupportedLanguage, problem: ProblemDefinition): string => {
  const problemHeader = `LeetCode #${problem.leetCodeNumber}: ${problem.title}`;
  const summary = flattenForComment(problem.summary);
  const inputFormat = flattenForComment(problem.inputFormat);
  const outputFormat = flattenForComment(problem.outputFormat);

  if (language === 'python') {
    return `# ${problemHeader}
# ${summary}
# Input: ${inputFormat}
# Output: ${outputFormat}

import sys

def solve(lines):
    # TODO: Parse lines and return the required output as a string.
    return ''

if __name__ == '__main__':
    lines = [line.rstrip('\\n') for line in sys.stdin]
    answer = solve(lines)
    if answer is not None:
        print(answer)`;
  }

  if (language === 'javascript') {
    return `// ${problemHeader}
// ${summary}
// Input: ${inputFormat}
// Output: ${outputFormat}

const fs = require('fs');

function solve(lines) {
  // TODO: Parse lines and return the required output as a string.
  return '';
}

const input = fs.readFileSync(0, 'utf-8').trim();
const lines = input.length > 0 ? input.split(/\\r?\\n/) : [];
const answer = solve(lines);
if (answer !== undefined && answer !== null) {
  console.log(answer);
}`;
  }

  if (language === 'c') {
    return `/*
 * ${problemHeader}
 * ${summary}
 * Input: ${inputFormat}
 * Output: ${outputFormat}
 */

#include <stdio.h>

int main(void) {
  /*
   * TODO:
   * 1. Read stdin using scanf/fgets.
   * 2. Implement the solution.
   * 3. Print output exactly in the required format.
   */
  return 0;
}`;
  }

  return `/*
 * ${problemHeader}
 * ${summary}
 * Input: ${inputFormat}
 * Output: ${outputFormat}
 */

#include <iostream>
#include <string>
#include <vector>

int main() {
  /*
   * TODO:
   * 1. Read stdin with std::getline/std::cin.
   * 2. Implement the solution.
   * 3. Print output exactly in the required format.
   */
  return 0;
}`;
};

const HomePage = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [draftByLanguage, setDraftByLanguage] = useState<Record<SupportedLanguage, string>>(templates);
  const [stdin, setStdin] = useState('World');
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const [problemBank, setProblemBank] = useState<ProblemDefinition[]>([]);
  const [isProblemBankLoading, setIsProblemBankLoading] = useState(true);
  const [problemBankError, setProblemBankError] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState('');

  const activeCode = useMemo(() => draftByLanguage[language], [draftByLanguage, language]);

  const selectedProblem = useMemo(() => {
    if (!problemBank.length) {
      return null;
    }

    return problemBank.find((problem) => problem.id === selectedProblemId) ?? problemBank[0];
  }, [problemBank, selectedProblemId]);

  const selectedTestCase = useMemo(() => {
    if (!selectedProblem || !selectedProblem.testCases.length) {
      return null;
    }

    return (
      selectedProblem.testCases.find((testCase) => testCase.id === selectedTestCaseId) ??
      selectedProblem.testCases[0]
    );
  }, [selectedProblem, selectedTestCaseId]);

  useEffect(() => {
    let isActive = true;

    const loadProblemBank = async () => {
      setIsProblemBankLoading(true);
      setProblemBankError('');

      try {
        const fetchedProblems = await getProblemBank();
        if (!isActive) {
          return;
        }

        setProblemBank(fetchedProblems);
        setSelectedProblemId(fetchedProblems[0]?.id ?? '');
        setSelectedTestCaseId(fetchedProblems[0]?.testCases[0]?.id ?? '');
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Failed to load problem bank';
        setProblemBankError(message);
      } finally {
        if (isActive) {
          setIsProblemBankLoading(false);
        }
      }
    };

    void loadProblemBank();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProblem?.testCases.length) {
      return;
    }

    const selectedCaseExists = selectedProblem.testCases.some(
      (testCase) => testCase.id === selectedTestCaseId,
    );

    if (!selectedCaseExists) {
      setSelectedTestCaseId(selectedProblem.testCases[0].id);
    }
  }, [selectedProblem, selectedTestCaseId]);

  const setActiveCode = (value: string) => {
    setDraftByLanguage((previous) => ({
      ...previous,
      [language]: value,
    }));
  };

  const runCode = async (inputToUse: string) => {
    setIsRunning(true);
    setError('');

    try {
      const executeResponse = await executeCode({
        language,
        code: activeCode,
        stdin: inputToUse,
      });
      setResult(executeResponse);
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Failed to execute';
      setError(message);
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRun = () => {
    void runCode(stdin);
  };

  const handleLoadStarter = () => {
    if (!selectedProblem) {
      return;
    }

    setActiveCode(buildStarterTemplate(language, selectedProblem));
  };

  const handleUseTestInput = () => {
    if (!selectedTestCase) {
      return;
    }

    setStdin(selectedTestCase.input);
  };

  const handleRunSelectedTest = () => {
    if (!selectedTestCase) {
      return;
    }

    setStdin(selectedTestCase.input);
    void runCode(selectedTestCase.input);
  };

  return (
    <main className="layout-root">
      <section className="hero">
        <p className="eyebrow">Secure Code Execution Sandbox</p>
        <h1>CodeArena</h1>
        <p>
          Execute Python, JavaScript, C, and C++ in isolated Docker containers with strict CPU,
          memory, timeout, and output limits.
        </p>
      </section>

      <section className="controls-row panel">
        <LanguageSelector value={language} onChange={setLanguage} />
        <button type="button" className="run-button" onClick={handleRun} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </section>

      <ProblemBankPanel
        problems={problemBank}
        selectedProblem={selectedProblem}
        selectedTestCase={selectedTestCase}
        selectedProblemId={selectedProblemId}
        selectedTestCaseId={selectedTestCaseId}
        loading={isProblemBankLoading}
        error={problemBankError}
        onProblemChange={setSelectedProblemId}
        onTestCaseChange={setSelectedTestCaseId}
        onLoadStarter={handleLoadStarter}
        onUseTestInput={handleUseTestInput}
        onRunSelectedTest={handleRunSelectedTest}
      />

      <section className="workspace-grid">
        <CodeEditorPanel language={language} code={activeCode} onCodeChange={setActiveCode} />

        <div className="side-column">
          <div className="panel stdin-panel">
            <div className="panel-header">
              <h2>Input (stdin)</h2>
            </div>
            <textarea
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              placeholder="Optional input for your program"
              rows={8}
            />
          </div>

          <OutputConsole result={result} error={error} />
        </div>
      </section>
    </main>
  );
};

export default HomePage;
