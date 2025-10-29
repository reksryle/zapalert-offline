import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useNetworkStatus from "../hooks/useNetworkStatus";


const Login = () => {
  const navigate = useNavigate();
  const networkStatus = useNetworkStatus();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordTooltip, setShowForgotPasswordTooltip] = useState(false);

  const toastStyle = {
    toastId: "loginToast",
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
      width: "280px",
      marginTop: "20px",
    },
    closeButton: false,
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);

    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        const { role } = res.data;
        if (
          (role === "resident" && location.pathname !== "/resident") ||
          (role === "responder" && location.pathname !== "/responder") ||
          (role === "admin" && location.pathname !== "/admin")
        ) {
          navigate(`/${role}`);
        }
      })
      .catch(() => {
        if (!localStorage.getItem("popupShown")) {
          const modalTimer = setTimeout(() => {
            setShowModal(true);
            localStorage.setItem("popupShown", "true");
          }, 2000);
          return () => clearTimeout(modalTimer);
        }
      });

    return () => clearTimeout(timer);
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const res = await axios.post(
        "/auth/login",
        { username: normalizedUsername, password },
        { withCredentials: true }
      );
      const { role } = res.data;
      navigate(`/${role}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid username or password",
        toastStyle
      );
    }
  };

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
            @keyframes bounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-15px);} }
            .animate-bounce { animation: bounce 1s infinite; }
            @keyframes spin { 0%{transform:rotate(0deg);}100%{transform:rotate(360deg);} }
            .animate-spin { animation: spin 2s linear infinite; }
            @keyframes blink { 0%,50%,100%{opacity:1;}25%,75%{opacity:0;} }
            .animate-blink { animation: blink 1s infinite; }
          `}
        </style>
      </div>
    );
  }

  const steps = [
    {
      img: null,
      title: "How to Install PWA ZapAlert!",
      desc: "Follow these quick steps to install ZapAlert on your device.",
      subtitle: "if the install button doesn't appear automatically.",
    },
    {
      img: "/tutorial/step1.gif",
      title: "Step 1: Install ZapAlert!",
      desc: "In Browser (Chrome), tap the 3 dots (top-right), choose 'Add to Home screen', then tap Install.",
    },
    {
      img: "/tutorial/step2.gif",
      title: "Step 2: Installing",
      desc: "Check your notification bar for the installation progress.",
    },
    {
      img: "/tutorial/step3.gif",
      title: "Step 3: Find ZapAlert!",
      desc: "ZapAlert! will appear on your home screen or app list.",
    },
    {
      img: "/tutorial/step4.png",
      title: "Step 4: Ready to Use",
      desc: "ZapAlert! is now installed like an app—quick access anytime during emergencies. Stay alert!",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-red-600 to-orange-500 flex items-center justify-center p-4 relative">
      <ToastContainer newestOnTop limit={3} />

      {/* Login Card */}
        <form
          onSubmit={handleLogin}
          className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md px-8 pt-8 pb-4 space-y-6 border border-white/30"
        >
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/icons/zapalert-logo.png"
            alt="ZAPALERT Logo"
            className="h-20 w-auto mb-4 drop-shadow-lg"
          />
          <h1 className="text-4xl font-black text-red-700 tracking-wider drop-shadow-sm">
            ZAPALERT
          </h1>
          <p className="text-gray-600 text-sm mt-2 max-w-xs">
            Emergency Monitoring & Reporting System
          </p>
        </div>

        {/* Guide */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800 text-left">
            Sign in
          </h2>
          <p className="text-sm text-gray-600 text-left">
            Login to your account
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3 pr-12 font-medium text-gray-900 bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-600 text-sm font-semibold"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          
          {/* Forgot Password Note */}
          <div className="flex justify-end relative -top-4 -left-1">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowForgotPasswordTooltip(!showForgotPasswordTooltip);
                }}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200 font-medium"
              >
                Forgot Password?
              </button>
              
              {/* Tooltip */}
              {showForgotPasswordTooltip && (
                <>
                  <div 
                    className="fixed inset-0 z-0"
                    onClick={() => setShowForgotPasswordTooltip(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-red-200 rounded-lg shadow-lg p-3 z-10">
                    <div className="text-xs text-gray-700 text-center leading-relaxed">
                      Please approach the Barangay for assistance with your account.
                    </div>
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-t border-l border-red-200 transform rotate-45"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Login Button and Sign Up */}
        <div className="relative -top-5">
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-bold rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-red-600 font-semibold hover:text-red-800 hover:underline transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>

      {/* Help Button */}
      {!showModal && (
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setShowModal(true);
          }}
          className="fixed top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-white/30 backdrop-blur-lg"
          title="How to install ZapAlert"
        >
          ?
        </button>
      )}

      {/* Tutorial Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            key={step}
            className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-3xl max-w-sm w-full mx-4 p-6 space-y-5 text-gray-800 relative shadow-2xl border border-white/30 transform animate-tutorial-popup"
          >
            {/* Step 0 = Welcome */}
            {step === 0 ? (
              <>
                <h3 className="text-2xl font-extrabold text-red-700 text-center">
                  Welcome to ZapAlert!
                </h3>
                <p className="text-sm text-gray-700 text-center leading-relaxed">
                  ZapAlert is an emergency alert and monitoring system for{" "}
                  <strong>Barangay Zapatera</strong>. It allows residents to
                  report incidents and ensures quick notifications for
                  responders. This is a CAPSTONE Project developed by students
                  from Asian College of Technology.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-300"
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-red-700 text-center">
                  {steps[step - 1].title}
                </h3>
                {steps[step - 1].subtitle && (
                  <p className="text-xs italic text-gray-500 text-center -mt-1 mb-2">
                    {steps[step - 1].subtitle}
                  </p>
                )}
                {steps[step - 1].img && (
                  <img
                    key={step}
                    src={`${steps[step - 1].img}?${Date.now()}`}
                    alt={steps[step - 1].title}
                    className="w-full rounded-xl mb-4 shadow-lg border-2 border-red-100 animate-fadeSlide"
                  />
                )}
                <p className="text-sm text-gray-700 text-center mb-4 leading-relaxed animate-fadeSlide">
                  {steps[step - 1].desc}
                </p>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                    >
                      Back
                    </button>
                  )}
                  {step < steps.length ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold rounded-xl hover:scale-105 transition-all"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold rounded-xl hover:scale-105 transition-all"
                    >
                      Continue to Login
                    </button>
                  )}
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center mt-4 space-x-2">
                  {[0, ...steps.map((_, i) => i + 1)].map((s) => (
                    <div
                      key={s}
                      className={`w-3 h-3 rounded-full transition-all ${
                        s === step 
                          ? "bg-red-600 scale-110" 
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>
        {`
        @keyframes tutorial-popup {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-tutorial-popup {
          animation: tutorial-popup 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-fadeSlide {
          animation: fadeSlide 0.6s ease-out forwards;
        }
        `}
      </style>
    </div>
  );
};

export default Login;