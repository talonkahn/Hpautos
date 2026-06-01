import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// SellCar is now handled by admin only.
// Users are redirected to BecomeSeller to subscribe.
export default function SellCar() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/BecomeSeller', { replace: true }); }, []);
  return null;
}
