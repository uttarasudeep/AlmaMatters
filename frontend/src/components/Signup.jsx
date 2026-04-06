import React, { useState } from "react";
import "./Signup.css";
import { useNavigate } from "react-router-dom";

import logo from "../assets/silverlogowithname.png";

export default function Signup() {

  const [selectedRole, setSelectedRole] = useState("");

  const navigate = useNavigate();

  const handleNext = () => {

    if(selectedRole === "student")
      navigate("/signup/student");

    else if(selectedRole === "alumni")
      navigate("/signup/alumni");

    else if(selectedRole === "admin")
      navigate("/signup/admin");

    else
      alert("Please select a role");

  };


  return (

    <div className="signup-container">

      <div className="signup-card">

        <img src={logo} alt="AlmaMatters Logo" className="signup-logo" />

        <h2>Sign Up</h2>

        <p className="subtitle">
          How would you like to join AlmaMATTERS?
        </p>

        <p className="subtitle2">
          Select your role to begin
        </p>


        <div className="roles">


          <div
            className={`role-card ${selectedRole==="student" ? "active" : ""}`}
            onClick={()=>setSelectedRole("student")}
          >
            🎓
            <h3>Student</h3>
            <p>Current student</p>
          </div>


          <div
            className={`role-card ${selectedRole==="alumni" ? "active" : ""}`}
            onClick={()=>setSelectedRole("alumni")}
          >
            👨‍🎓
            <h3>Alumni</h3>
            <p>Former student</p>
          </div>


          <div
            className={`role-card ${selectedRole==="admin" ? "active" : ""}`}
            onClick={()=>setSelectedRole("admin")}
          >
            🏫
            <h3>Admin</h3>
            <p>Institution administrator</p>
          </div>


        </div>


        <button className="next-btn" onClick={handleNext}>
          Next
        </button>


      </div>

    </div>

  );

}