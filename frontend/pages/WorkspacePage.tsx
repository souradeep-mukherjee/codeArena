import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditorPanel from '../components/CodeEditorPanel';
import OutputConsole from '../components/OutputConsole';
import {
  AuthUser,
  ExecuteResponse,
  ProblemDefinition,
  SubmissionItem,
  SupportedLanguage,
  executeCode,
  getProblemBank,
  getSubmissions,
  logout,
  updateAccount,
} from '../services/api';

interface WorkspacePageProps {
  currentUser: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
  onLogoutSuccess: () => void;
}

type LeftTab = 'description' | 'tests' | 'submissions';

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePasswordStrength = (password: string): string | null => {
  if (password.length < 8 || password.length > 72) {
    return 'Password must be between 8 and 72 characters.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }

  if (!/\d/.test(password)) {
    return 'Password must include at least one digit.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.';
  }

  return null;
};

const WorkspacePage = ({ currentUser, onUserUpdate, onLogoutSuccess }: WorkspacePageProps) => {
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [draftByLanguage, setDraftByLanguage] = useState<Record<SupportedLanguage, string>>(templates);
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<LeftTab>('description');

  const [problemBank, setProblemBank] = useState<ProblemDefinition[]>([]);
  const [isProblemBankLoading, setIsProblemBankLoading] = useState(true);
  const [problemBankError, setProblemBankError] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState('');
  const [lastTestVerdict, setLastTestVerdict] = useState('');

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState(currentUser.email);
  const [accountCurrentPassword, setAccountCurrentPassword] = useState('');
  const [accountNewPassword, setAccountNewPassword] = useState('');
  const [accountConfirmNewPassword, setAccountConfirmNewPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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

  const loadSubmissions = async () => {
    setIsSubmissionsLoading(true);
    setSubmissionsError('');

    try {
      const response = await getSubmissions(1, 20);
      setSubmissions(response.items);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load submission history';
      setSubmissionsError(message);
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubmissions();
  }, []);

  useEffect(() => {
    setAccountEmail(currentUser.email);
  }, [currentUser.email]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isUserMenuOpen]);

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

  const runCode = async (inputToUse: string, expectedOutput?: string) => {
    setIsRunning(true);
    setError('');
    setLastTestVerdict('');

    try {
      const executeResponse = await executeCode({
        language,
        code: activeCode,
        stdin: inputToUse,
      });

      setResult(executeResponse);
      void loadSubmissions();

      if (typeof expectedOutput === 'string') {
        const actual = executeResponse.stdout.trim();
        const expected = expectedOutput.trim();
        const passed = executeResponse.status === 'success' && actual === expected;

        setLastTestVerdict(
          passed
            ? 'Test result: Passed'
            : `Test result: Failed (expected "${expected}", got "${actual}")`,
        );
      }
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
    void runCode(selectedTestCase.input, selectedTestCase.expectedOutput);
  };

  const openAccountSettings = () => {
    setIsUserMenuOpen(false);
    setIsAccountModalOpen(true);
    setAccountEmail(currentUser.email);
    setAccountCurrentPassword('');
    setAccountNewPassword('');
    setAccountConfirmNewPassword('');
    setAccountError('');
    setAccountSuccess('');
  };

  const closeAccountSettings = () => {
    if (isSavingAccount) {
      return;
    }

    setIsAccountModalOpen(false);
  };

  const handleAccountSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountError('');
    setAccountSuccess('');

    const normalizedEmail = accountEmail.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      setAccountError('Email is invalid.');
      return;
    }

    if (!accountCurrentPassword) {
      setAccountError('Current password is required.');
      return;
    }

    const emailChanged = normalizedEmail !== currentUser.email;
    const passwordChangeRequested = Boolean(accountNewPassword || accountConfirmNewPassword);

    if (passwordChangeRequested) {
      if (!accountNewPassword || !accountConfirmNewPassword) {
        setAccountError('Both new password and confirm new password are required.');
        return;
      }

      const passwordError = validatePasswordStrength(accountNewPassword);
      if (passwordError) {
        setAccountError(passwordError);
        return;
      }

      if (accountNewPassword !== accountConfirmNewPassword) {
        setAccountError('New password and confirm new password do not match.');
        return;
      }
    }

    if (!emailChanged && !passwordChangeRequested) {
      setAccountError('No account changes detected.');
      return;
    }

    setIsSavingAccount(true);

    try {
      const updatedUser = await updateAccount({
        currentPassword: accountCurrentPassword,
        email: emailChanged ? normalizedEmail : undefined,
        newPassword: passwordChangeRequested ? accountNewPassword : undefined,
        confirmNewPassword: passwordChangeRequested ? accountConfirmNewPassword : undefined,
      });

      onUserUpdate(updatedUser);
      setAccountCurrentPassword('');
      setAccountNewPassword('');
      setAccountConfirmNewPassword('');
      setAccountSuccess('Account updated successfully.');
    } catch (accountUpdateError) {
      const message =
        accountUpdateError instanceof Error ? accountUpdateError.message : 'Failed to update account';
      setAccountError(message);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    setIsUserMenuOpen(false);

    try {
      await logout();
      onLogoutSuccess();
    } catch (logoutError) {
      const message = logoutError instanceof Error ? logoutError.message : 'Logout failed';
      setError(message);
    }
  };

  return (
    <main className="lc-shell">
      <header className="lc-topbar">
        <div className="lc-brand">CodeArena</div>

        <div className="lc-top-controls">
          <select
            className="lc-select"
            value={selectedProblemId}
            onChange={(event) => setSelectedProblemId(event.target.value)}
            disabled={isProblemBankLoading || !!problemBankError || !problemBank.length}
          >
            {problemBank.map((problem) => (
              <option key={problem.id} value={problem.id}>
                #{problem.leetCodeNumber} {problem.title}
              </option>
            ))}
          </select>

          <select
            className="lc-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>

          <button className="lc-run" type="button" onClick={handleRun} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <div className="lc-user-menu" ref={userMenuRef}>
            <button
              className="lc-user-trigger"
              type="button"
              onClick={() => setIsUserMenuOpen((previous) => !previous)}
            >
              {currentUser.fullName}
            </button>

            {isUserMenuOpen && (
              <div className="lc-user-dropdown">
                <button type="button" className="lc-user-action" onClick={openAccountSettings}>
                  Account Settings
                </button>
                <button
                  type="button"
                  className="lc-user-action lc-user-action-danger"
                  onClick={() => {
                    void handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="lc-main">
        <aside className="panel lc-left">
          <div className="lc-tabs">
            <button
              type="button"
              className={activeTab === 'description' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              type="button"
              className={activeTab === 'tests' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('tests')}
            >
              Test Cases
            </button>
            <button
              type="button"
              className={activeTab === 'submissions' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('submissions')}
            >
              Submissions
            </button>
          </div>

          <div className="lc-left-content">
            {problemBankError && <p className="panel-error">{problemBankError}</p>}
            {isProblemBankLoading && <p className="panel-muted">Loading problems...</p>}

            {!isProblemBankLoading && selectedProblem && activeTab === 'description' && (
              <>
                <h2>
                  #{selectedProblem.leetCodeNumber} {selectedProblem.title}
                </h2>
                <p
                  className={`difficulty difficulty-${selectedProblem.difficulty.toLowerCase()}`}
                >
                  {selectedProblem.difficulty}
                </p>
                <p>{selectedProblem.summary}</p>
                <p>
                  <strong>Input:</strong> {selectedProblem.inputFormat}
                </p>
                <p>
                  <strong>Output:</strong> {selectedProblem.outputFormat}
                </p>
                <a href={selectedProblem.sourceUrl} target="_blank" rel="noreferrer">
                  View on LeetCode
                </a>
              </>
            )}

            {!isProblemBankLoading && selectedProblem && activeTab === 'tests' && (
              <>
                <label className="lc-inline-label">
                  <span>Case</span>
                  <select
                    className="lc-select"
                    value={selectedTestCaseId}
                    onChange={(event) => setSelectedTestCaseId(event.target.value)}
                  >
                    {selectedProblem.testCases.map((testCase) => (
                      <option key={testCase.id} value={testCase.id}>
                        {testCase.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="lc-action-row">
                  <button type="button" className="ghost-button" onClick={handleLoadStarter}>
                    Load Starter
                  </button>
                  <button type="button" className="ghost-button" onClick={handleUseTestInput}>
                    Use Input
                  </button>
                  <button type="button" className="ghost-button" onClick={handleRunSelectedTest}>
                    Run Case
                  </button>
                </div>

                {selectedTestCase && (
                  <>
                    <h3>Input</h3>
                    <pre className="console">{selectedTestCase.input}</pre>
                    <h3>Expected</h3>
                    <pre className="console">{selectedTestCase.expectedOutput}</pre>
                    {lastTestVerdict && <p className="panel-muted">{lastTestVerdict}</p>}
                  </>
                )}
              </>
            )}

            {activeTab === 'submissions' && (
              <>
                {isSubmissionsLoading && <p className="panel-muted">Loading submissions...</p>}
                {submissionsError && <p className="panel-error">{submissionsError}</p>}

                {!isSubmissionsLoading && !submissionsError && submissions.length === 0 && (
                  <p className="panel-muted">No submissions yet.</p>
                )}

                {!isSubmissionsLoading && submissions.length > 0 && (
                  <ul className="submission-list">
                    {submissions.map((submission) => (
                      <li key={submission.id}>
                        <div>
                          <strong>{submission.language.toUpperCase()}</strong> · {submission.status}
                        </div>
                        <small>{new Date(submission.createdAt).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </aside>

        <section className="lc-right">
          <CodeEditorPanel language={language} code={activeCode} onCodeChange={setActiveCode} />

          <div className="lc-bottom-grid">
            <div className="panel stdin-panel">
              <div className="panel-header">
                <h2>Input (stdin)</h2>
              </div>
              <textarea
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                placeholder="Enter custom test input"
                rows={8}
              />
            </div>

            <OutputConsole result={result} error={error} />
          </div>
        </section>
      </div>

      {isAccountModalOpen && (
        <div
          className="modal-backdrop"
          onClick={closeAccountSettings}
          role="presentation"
        >
          <section
            className="account-modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-settings-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-header">
              <h2 id="account-settings-title">Account Settings</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={closeAccountSettings}
                disabled={isSavingAccount}
              >
                Close
              </button>
            </div>

            <form className="account-form" onSubmit={handleAccountSave}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(event) => setAccountEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              <label>
                <span>Current Password</span>
                <input
                  type="password"
                  value={accountCurrentPassword}
                  onChange={(event) => setAccountCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                />
              </label>

              <label>
                <span>New Password (optional)</span>
                <input
                  type="password"
                  value={accountNewPassword}
                  onChange={(event) => setAccountNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                />
              </label>

              <label>
                <span>Confirm New Password</span>
                <input
                  type="password"
                  value={accountConfirmNewPassword}
                  onChange={(event) => setAccountConfirmNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Retype new password"
                />
              </label>

              <p className="account-help">
                To save changes, provide your current password. New password must be strong (8-72
                chars, uppercase, lowercase, number, special character).
              </p>

              {accountError && <p className="panel-error">{accountError}</p>}
              {accountSuccess && <p className="panel-success">{accountSuccess}</p>}

              <div className="lc-action-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={closeAccountSettings}
                  disabled={isSavingAccount}
                >
                  Cancel
                </button>
                <button type="submit" className="lc-run" disabled={isSavingAccount}>
                  {isSavingAccount ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};

export default WorkspacePage;
