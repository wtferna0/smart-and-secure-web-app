import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import ChatbotWidget from "./components/ChatbotWidget.jsx";

import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Play from "./pages/Play.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx"; // <-- NEW
import Profile from "./pages/user/Profile.jsx";
import Checkout from "./pages/Checkout.jsx";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminOrders from "./pages/admin/Orders.jsx";
import AdminMenuStock from "./pages/admin/MenuStock.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminCrowd from "./pages/admin/Crowd.jsx";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-shell">
          <Navbar />
          <main className="main">
            <Routes>
              {/* Public routes (guests can browse and checkout) */}
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/play" element={<Play />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} /> {/* NEW */}
              <Route path="/checkout" element={<Checkout />} />

              {/* Customer-only */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allow={["customer"]}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Admin-only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allow={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute allow={["admin"]}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/menu-stock"
                element={
                  <ProtectedRoute allow={["admin"]}>
                    <AdminMenuStock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allow={["admin"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/crowd"
                element={
                  <ProtectedRoute allow={["admin"]}>
                    <AdminCrowd />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
          <CartDrawer />
          <ChatbotWidget />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
