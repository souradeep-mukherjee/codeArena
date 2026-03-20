import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import WorkspacePage from '../pages/WorkspacePage';
import { AuthUser, getCurrentUser } from '../services/api';

const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) {
          return;
        }
        setUser(currentUser);
      } catch {
        if (!isMounted) {
          return;
        }
        setUser(null);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackRoute = useMemo(() => (user ? '/app' : '/login'), [user]);

  if (isBootstrapping) {
    return (
      <main className="boot-screen">
        <p>Loading CodeArena...</p>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/app" replace />
            ) : (
              <LoginPage
                onLoginSuccess={(loggedInUser) => {
                  setUser(loggedInUser);
                }}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/app" replace />
            ) : (
              <SignupPage
                onSignupSuccess={(signedUpUser) => {
                  setUser(signedUpUser);
                }}
              />
            )
          }
        />
        <Route
          path="/app"
          element={
            user ? (
              <WorkspacePage
                currentUser={user}
                onUserUpdate={(updatedUser) => {
                  setUser(updatedUser);
                }}
                onLogoutSuccess={() => {
                  setUser(null);
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
