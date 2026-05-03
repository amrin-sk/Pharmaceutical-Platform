import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import SalesHistory from './pages/SalesHistory';
import Suppliers from './pages/Suppliers';
import IntelHub from './pages/IntelHub';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory"  element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/sales"      element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="/sales-history" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
        <Route path="/suppliers"  element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/intel"      element={<ProtectedRoute><IntelHub /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;