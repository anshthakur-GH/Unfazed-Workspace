import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Subspaces from './pages/Subspaces';
import Todos from './pages/Todos';
import Agency from './pages/Agency';
import Records from './pages/Records';
import DailyWorks from './pages/DailyWorks';
import Invoices from './pages/Invoices';
import Leads from './pages/Leads';

function App() {
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const AdminRoute = ({ children }) => {
    const username = localStorage.getItem('username');
    const allowedUsers = ['Ansh_Unfazed'];
    const canViewInvoices = allowedUsers.includes(username);

    if (!canViewInvoices) {
      return <Navigate to="/dashboard/subspaces" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="subspaces" element={<Subspaces />} />
          <Route
            path="invoices"
            element={
              <AdminRoute>
                <Invoices />
              </AdminRoute>
            }
          />
          <Route path="todos" element={<Todos />} />
          <Route path="leads" element={<Leads />} />
          <Route path="agency" element={<Agency />} />
          <Route path="daily-works" element={<DailyWorks />} />
          <Route path="records" element={<Records />} />

          <Route path="" element={<Navigate to="subspaces" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
