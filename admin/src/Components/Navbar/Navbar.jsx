import React from "react";
import "./Navbar.css";
import navigationprofile from "../../assets/navigation-profile.png";
import onlineshopping from "../../assets/online-shopping.png";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="nav-logo">
        <img src={onlineshopping} alt="Shop logo" className="logo" />
        <div className="nav-title">
          <h2>SHOPPER</h2>
          <p>Admin Panel</p>
        </div>
      </div>

      <img src={navigationprofile} alt="Profile" className="nav-profile" />
    </div>
  );
};

export default Navbar;
