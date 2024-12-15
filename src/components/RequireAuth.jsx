import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '../firebase/auth';

const RequireAuth = ({ children, adminRequired = false }) => {
  const { user, loading, userRole } = useFirebaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (adminRequired && userRole !== 'admin') {
        navigate('/'); // Redirect non-admin users trying to access admin pages
      }
    }
  }, [user, loading, navigate, adminRequired, userRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (adminRequired && userRole !== 'admin') {
    return null;
  }

  return user ? children : null;
};

export default RequireAuth;
