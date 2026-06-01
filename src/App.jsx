import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import Layout from '@/Layout';
import Home from '@/pages/Home';
import Browse from '@/pages/Browse';
import CarDetails from '@/pages/CarDetails';
import BecomeSellerPage from '@/pages/BecomeSeller';
import SellerDashboard from '@/pages/SellerDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SavedCars from '@/pages/SavedCars';
import Messages from '@/pages/Messages';
import Stores from '@/pages/Stores';
import StoreDetails from '@/pages/StoreDetails';
import RegisterStore from '@/pages/RegisterStore';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PageNotFound from '@/lib/PageNotFound';
import { Toaster as Sonner } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/Browse" element={<Layout><Browse /></Layout>} />
            <Route path="/CarDetails" element={<Layout><CarDetails /></Layout>} />
            <Route path="/BecomeSeller" element={<Layout><BecomeSellerPage /></Layout>} />
            <Route path="/SellerDashboard" element={<Layout><SellerDashboard /></Layout>} />
            <Route path="/AdminDashboard" element={<Layout><AdminDashboard /></Layout>} />
            <Route path="/SavedCars" element={<Layout><SavedCars /></Layout>} />
            <Route path="/Messages" element={<Layout><Messages /></Layout>} />
            <Route path="/Stores" element={<Layout><Stores /></Layout>} />
            <Route path="/StoreDetails" element={<Layout><StoreDetails /></Layout>} />
            <Route path="/RegisterStore" element={<Layout><RegisterStore /></Layout>} />
            <Route path="/PaymentSuccess" element={<Layout><PaymentSuccess /></Layout>} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <Sonner richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
export default App;
