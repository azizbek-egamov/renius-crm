import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Yuklanmoqda...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirection logic for unauthorized access
        const fallbackPath = user.role === 'operator' ? '/clients' : user.role === 'teacher' ? '/students' : '/';
        
        // Show warning only once if they try to access something they shouldn't
        // We use a timeout to avoid react double-render toast spam during development
        setTimeout(() => {
            toast.error("Sizda ushbu bo'limga kirish huquqi yo'q");
        }, 100);

        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
