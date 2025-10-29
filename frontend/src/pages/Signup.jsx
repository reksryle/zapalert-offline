// frontend/src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import useNetworkStatus from "../hooks/useNetworkStatus";

const Signup = () => {
  const navigate = useNavigate();
  const networkStatus = useNetworkStatus();
  
  // ✅ Loading screen & wait screen states
  const [isLoading, setIsLoading] = useState(true);
  const [showWaitScreen, setShowWaitScreen] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    username: "",
    password: "",
    contactNumber: "",
    barrio: "",
    barangay: "Zapatera",
    role: "resident",
  });

  const [idImage, setIdImage] = useState(null);
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barrioOptions = [
    { value: "Bayabas", label: "Bayabas" },
    { value: "Caimito", label: "Caimito" },
    { value: "Creekside", label: "Creekside" },
    { value: "Green Mosque", label: "Green Mosque" },
    { value: "Lemonsito", label: "Lemonsito" },
    { value: "Lower Mangga", label: "Lower Mangga" },
    { value: "Sab-ah", label: "Sab-ah" },
    { value: "Upper Mangga", label: "Upper Mangga" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setIdImage(e.target.files[0]);

  const toastStyle = {
    toastId: "signupToast",
    position: "top-center",
    autoClose: 2500,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    transition: Slide,
    style: {
      backgroundColor: "#fff",
      color: "#b91c1c",
      border: "1px solid #f87171",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "0.95rem",
      fontWeight: "500",
      textAlign: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      width: "320px",
      marginTop: "20px",
    },
    closeButton: false,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const requiredFields = ["firstName", "lastName", "age", "username", "password", "contactNumber", "barrio"];
    for (let field of requiredFields) {
      if (!form[field] || form[field].trim() === "") {
        toast.error("Please fill in all required fields.", toastStyle);
        return;
      }
    }

    const ageNum = parseInt(form.age);
    if (!idImage) {
      toast.error("Please upload a valid ID image.", toastStyle);
      return;
    }
    if (!agree) {
      toast.error("You must agree before submitting.", toastStyle);
      return;
    }
    if (isNaN(ageNum) || ageNum < 7 || ageNum > 100) {
      toast.error("Age must be between 7 and 100.", toastStyle);
      return;
    }
    if (/^\d+$/.test(form.username)) {
      toast.error("Username must include at least one letter, not all numbers.", toastStyle);
      return;
    }
    if (/\s/.test(form.username)) {
      toast.error("Username cannot have spaces.", toastStyle);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    formData.append("validId", idImage);

    try {
      setIsSubmitting(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/signup`, formData, {
        withCredentials: true,
      });

      toast.success("Signup successful!", toastStyle);

      // ✅ After toast → wait screen → redirect
      setTimeout(() => {
        setShowWaitScreen(true);
        setTimeout(() => {
          navigate("/");
        }, 10000);
      }, 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed.", toastStyle);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-yellow-400 animate-spin"></div>
          <img
            src="/icons/zapalert-logo.png"
            alt="ZapAlert Logo"
            className="w-32 h-32 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-bounce"
          />
        </div>
        <p className="text-white text-2xl font-bold animate-blink">Loading...</p>

        <style>
          {`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
            .animate-bounce {
              animation: bounce 1s infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .animate-spin {
              animation: spin 2s linear infinite;
            }
            @keyframes blink {
              0%, 50%, 100% { opacity: 1; }
              25%, 75% { opacity: 0; }
            }
            .animate-blink {
              animation: blink 1s infinite;
            }
            @keyframes slowblink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            .animate-slowblink {
              animation: slowblink 2s infinite;
            }
          `}
        </style>
      </div>
    );
  }

  // ✅ Wait screen
  if (showWaitScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800 text-center p-6">
        <h2 className="text-white text-2xl font-extrabold tracking-wide drop-shadow-lg mb-4">
          Thank you for signing up!
        </h2>
        <p className="text-white text-lg font-medium opacity-90 max-w-md mb-6">
          You will receive an SMS soon from the Barangay about your account status.
          Please wait for your account approval.
        </p>
        <p className="text-white text-base font-semibold animate-slowblink">
          Redirecting to login...
        </p>

        <style>
          {`
            @keyframes slowblink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            .animate-slowblink {
              animation: slowblink 2s infinite;
            }
          `}
        </style>
      </div>
    );
  }

  // ✅ Signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-orange-500 flex items-center justify-center p-4 relative">
      <ToastContainer newestOnTop limit={3} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 border border-white/30"
      >


        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Create Account
          </h2>
          <p className="text-sm text-gray-600">
            Fill in your details to register
          </p>
        </div>

        <div className="space-y-4">
          {/* First / Last Name */}
          <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => {
              if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                handleChange(e);
              }
            }}
            className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => {
              if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                handleChange(e);
              }
            }}
            className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
          />
          </div>

          {/* Age */}
          <input
            type="text"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={(e) => {
              // ✅ Allow only digits
              if (/^\d*$/.test(e.target.value)) {
                handleChange(e);
              }
            }}
            className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
          />

          {/* Username */}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-red-600 font-medium"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Contact */}
          <input
            type="text"
            name="contactNumber"
            placeholder="Contact Number (09XXXXXXXXX)"
            value={form.contactNumber}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,11}$/.test(value)) handleChange(e);
            }}
            maxLength={11}
            className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
          />

          {/* Barrio + Barangay */}
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              name="barangay"
              value="Zapatera"
              readOnly
              className="col-span-1 px-3 py-3 font-medium text-gray-700 border-2 border-red-200 rounded-xl bg-gray-100"
            />
            <div className="col-span-2">
              <Select
                options={barrioOptions}
                value={barrioOptions.find((o) => o.value === form.barrio)}
                onChange={(s) => setForm({ ...form, barrio: s.value })}
                placeholder="Select your Barrio"
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#fecaca",
                    borderWidth: "2px",
                    borderRadius: "12px",
                    padding: "4px 8px",
                    boxShadow: "none",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    minHeight: "52px",
                    "&:hover": {
                      borderColor: "#f87171",
                    },
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#9ca3af",
                    fontSize: "0.95rem",
                  }),
                }}
              />
            </div>
          </div>

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
          >
            <option value="resident">Resident</option>
            <option value="responder">Responder</option>
          </select>

          {/* Upload ID */}
          <div>
            <label
              htmlFor="validId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload valid ID to verify your residency:
            </label>
            <div className="flex items-center justify-between border-2 border-dashed border-red-200 rounded-xl px-4 py-3 bg-white/50">
              <input
                type="file"
                id="validId"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-sm text-gray-600">
                {idImage ? idImage.name : "No file chosen"}
              </span>
              <label
                htmlFor="validId"
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl cursor-pointer hover:scale-105 transition-all text-sm font-medium shadow-md"
              >
                Browse
              </label>
            </div>
          </div>

          {/* Agreement */}
          <label className="flex items-start space-x-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-red-300 rounded"
            />
            <span>
              I confirm that I am of legal age (18+) or a minor with consent.  
              I agree to use this app responsibly for emergencies only.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 shadow-lg ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/" className="text-red-600 font-semibold hover:text-red-800 hover:underline transition-colors">
              Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;