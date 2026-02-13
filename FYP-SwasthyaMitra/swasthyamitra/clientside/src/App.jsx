import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import MyPrescriptions from "./pages/MyPrescriptions";
import Appointment from "./pages/Appointment";
import SearchResults from "./pages/SearchResults";
import HospitalDetail from "./pages/HospitalDetail";
import Navbar from "./components/Navbar";
import GlobalSearch from "./components/GlobalSearch";
import Footer from "./components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login";
  const isHomePage = location.pathname === "/";
  const isSearchPage = location.pathname === "/search";

  return (
    <div className="mx-4 sm:mx-[10%]">
      <ToastContainer />
      {!isAuthPage && (
        <>
          <Navbar />
          {(isHomePage || isSearchPage) && (
            <div className="mb-6 -mx-4 sm:-mx-[10%] px-4 sm:px-[10%] py-3">
              <GlobalSearch />
            </div>
          )}
        </>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/my-prescriptions" element={<MyPrescriptions />} />
        <Route path="/appointment/:docId" element={<Appointment />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/hospital/:id" element={<HospitalDetail />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
