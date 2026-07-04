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

  if (!user) {
    const isFlutter = navigator.userAgent.includes('LearnProofApp') || !!window.GoogleSignInChannel;
    return <Navigate to={isFlutter ? "/login" : "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
