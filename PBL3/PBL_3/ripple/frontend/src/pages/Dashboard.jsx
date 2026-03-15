import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Ripple from './Ripple';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    
    const userIsAuthenticated = true;  

    if (!userIsAuthenticated) {
      navigate('/LogIn');
    }
  }, [navigate]);

  return (
    <div>
      <Ripple />
      
    </div>
  );
};

export default Dashboard;
