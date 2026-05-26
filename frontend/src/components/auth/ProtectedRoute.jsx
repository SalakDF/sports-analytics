import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../utils/session";

export default function ProtectedRoute({ children }) {
  const currentUser = getCurrentUser();

  if (!currentUser?.id) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}