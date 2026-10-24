import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xl font-semibold">
        Checking credentials...
      </div>
    );
  }

  // If a stored token exists in localStorage, wait for AuthProvider state sync rather than kicking user out
  if (!user && typeof window !== 'undefined' && localStorage.getItem('google_token')) {
    return null;
  }

  if (!user) {
    const isFlutter = navigator.userAgent.includes('LearnProofApp') || !!window.GoogleSignInChannel;
    if (
      window.location.pathname.startsWith("/dashboard") || 
      window.location.pathname.startsWith("/classroom") ||
      window.location.pathname.startsWith("/ambassador")
    ) {
      sessionStorage.setItem("redirect_to", window.location.pathname + window.location.search);
      localStorage.setItem("redirect_to", window.location.pathname + window.location.search);
    }
    return <Navigate to={isFlutter ? "/login" : "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
