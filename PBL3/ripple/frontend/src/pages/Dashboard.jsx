import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

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
      <Navbar />
      
    </div>
  );
};

export default Dashboard;
