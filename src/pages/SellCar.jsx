import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function SellCar() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoading) return;
    if (isAdmin) navigate('/AdminDashboard', { replace: true });
    else navigate('/BecomeSeller', { replace: true });
  }, [isAdmin, isLoading]);
  return null;
}
