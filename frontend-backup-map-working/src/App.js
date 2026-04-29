import HomeNEW from "./pages/HomeNEW";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./pages/MapView";
import SellerProfile from "./pages/SellerProfile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeNEW />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/seller/:sellerId" element={<SellerProfile />} />
      </Routes>
    </Router>
  );
}