import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  let effectiveUser = user;
  if (!effectiveUser && typeof window !== 'undefined') {
    const token = localStorage.getItem('google_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (!decoded.exp || decoded.exp > currentTime) {
          effectiveUser = {
            id: decoded.id || decoded.uid || decoded.sub,
            uid: decoded.uid || decoded.sub,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture
          };
        }
      } catch (e) {
        // invalid token
      }
    }
  }

  if (loading && !effectiveUser) {
    return (
      <div className="h-screen flex items-center justify-center text-xl font-semibold">
        Checking credentials...
      </div>
    );
  }

  if (!effectiveUser) {
    const isFlutter = typeof navigator !== 'undefined' && (navigator.userAgent.includes('LearnProofApp') || !!window.GoogleSignInChannel);
    if (
      typeof window !== 'undefined' && (
        window.location.pathname.startsWith("/dashboard") || 
        window.location.pathname.startsWith("/classroom") ||
        window.location.pathname.startsWith("/ambassador")
      )
    ) {
      sessionStorage.setItem("redirect_to", window.location.pathname + window.location.search);
      localStorage.setItem("redirect_to", window.location.pathname + window.location.search);
    }
    return <Navigate to={isFlutter ? "/login" : "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
