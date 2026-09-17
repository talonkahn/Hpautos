import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from '@/lib/ScrollToTop';
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
import ResetPassword from '@/pages/ResetPassword';
import PageNotFound from '@/lib/PageNotFound';
import { Toaster as Sonner } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

// Wraps each route's page content in a quick fade so transitions
// between pages feel smooth instead of an abrupt cut.
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout><PageTransition><Home /></PageTransition></Layout>} />
        <Route path="/Browse" element={<Layout><PageTransition><Browse /></PageTransition></Layout>} />
        <Route path="/CarDetails" element={<Layout><PageTransition><CarDetails /></PageTransition></Layout>} />
        <Route path="/BecomeSeller" element={<Layout><PageTransition><BecomeSellerPage /></PageTransition></Layout>} />
        <Route path="/SellerDashboard" element={<Layout><PageTransition><SellerDashboard /></PageTransition></Layout>} />
        <Route path="/AdminDashboard" element={<Layout><PageTransition><AdminDashboard /></PageTransition></Layout>} />
        <Route path="/SavedCars" element={<Layout><PageTransition><SavedCars /></PageTransition></Layout>} />
        <Route path="/Messages" element={<Layout><PageTransition><Messages /></PageTransition></Layout>} />
        <Route path="/Stores" element={<Layout><PageTransition><Stores /></PageTransition></Layout>} />
        <Route path="/StoreDetails" element={<Layout><PageTransition><StoreDetails /></PageTransition></Layout>} />
        <Route path="/RegisterStore" element={<Layout><PageTransition><RegisterStore /></PageTransition></Layout>} />
        <Route path="/PaymentSuccess" element={<Layout><PageTransition><PaymentSuccess /></PageTransition></Layout>} />
        <Route path="/ResetPassword" element={<ResetPassword />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AnimatedRoutes />
        </Router>
        <Toaster />
        <Sonner richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
