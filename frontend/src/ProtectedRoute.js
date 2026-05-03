import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" />; // 👈 go to LOGIN, not register
  }

  return children;
};

export default ProtectedRoute;