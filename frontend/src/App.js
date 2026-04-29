import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomeNEW from "./pages/HomeNEW";
import MapView from "./pages/MapView";
import SellerAuth from "./pages/SellerAuth";
import ListYourBusiness from "./pages/ListYourBusiness";
import ReviewSubmissions from "./pages/ReviewSubmissions";
import SellerProfile from "./pages/SellerProfile";
import SellerDashboard from "./pages/SellerDashboard";
import VisitorAuth from "./pages/VisitorAuth";
import MySellers from "./pages/MySellers";
import ApplicationPending from "./pages/ApplicationPending";
import SellerAgreement from "./pages/SellerAgreement";
import CreatePassword from "./pages/CreatePassword";
import PaymentSetup from "./pages/PaymentSetup";
import PaymentSuccess from "./pages/PaymentSuccess";

export default function App() {
  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={<HomeNEW />} />

      {/* MAP */}
      <Route path="/map" element={<MapView />} />

      {/* SELLER PROFILE */}
      <Route path="/seller-profile/:id" element={<SellerProfile />} />
      <Route path="/seller-profile" element={<SellerProfile />} />

      {/* SELLER AUTH + FLOW */}
      <Route path="/seller-auth" element={<SellerAuth />} />
      <Route path="/list-your-business" element={<ListYourBusiness />} />
      <Route path="/review-submissions" element={<ReviewSubmissions />} />
      <Route path="/seller-dashboard" element={<SellerDashboard />} />
      <Route path="/application-pending" element={<ApplicationPending />} />
      <Route path="/seller-agreement" element={<SellerAgreement />} />
      <Route path="/create-password" element={<CreatePassword />} />
      <Route path="/payment-setup" element={<PaymentSetup />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />

      {/* VISITOR */}
      <Route path="/auth" element={<VisitorAuth />} />
      <Route path="/my-sellers" element={<MySellers />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}