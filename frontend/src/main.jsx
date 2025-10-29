import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 

// This is the entry point of the React application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter enables navigation between pages */}
    <BrowserRouter>
      {/* App contains all the routes and pages */}
      <App />
      
      {/* Toaster displays popup notifications throughout the app */}
      <Toaster position="top-right" />
    </BrowserRouter>
  </React.StrictMode>,
);