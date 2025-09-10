import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import ChatbotWidget from "./components/ChatbotWidget.jsx";
import { CartProvider } from "./context/CartContext.jsx";

import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Play from "./pages/Play.jsx";
import Login from "./pages/auth/Login.jsx";
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
    <CartProvider>
      <div className="app-shell">
        <Navbar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/play" element={<Play />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/menu-stock" element={<AdminMenuStock />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/crowd" element={<AdminCrowd />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer />
        <ChatbotWidget />
      </div>
    </CartProvider>
  );
}
