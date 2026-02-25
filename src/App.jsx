import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import ComponentShowcase from './pages/ComponentShowcase';
import { createOrder } from "./services/orderService"

function AppContent() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {!window.location.pathname.includes('admin-login') && (
        <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      )}
      
      <main className="flex-grow">
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/components" element={<ComponentShowcase />} />

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!window.location.pathname.includes('admin-login') && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </BrowserRouter>
  )
}

const testCheckout = async () => {
  const cart = [
    { id: "ID_PRODUCT_1", price: 12000, quantity: 2 }
  ]

  const customerData = {
    name: "Budi",
    phone: "08123456789",
    type: "takeaway",
    table: null
  }

  const result = await createOrder(cart, customerData)
  console.log("ORDER CREATED:", result)
}

export default App;