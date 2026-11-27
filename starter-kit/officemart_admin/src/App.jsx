import React from 'react';
import { Routes, Route, Navigate, useInRouterContext } from 'react-router-dom';
import ProductListPage from './pages/ProductListPage.jsx';
import ProductCreatePage from './pages/ProductCreatePage.jsx';
import ProductEditPage from './pages/ProductEditPage.jsx';
import './App.css';

export default function App() {
  const inRouter = useInRouterContext();

  return (
    <div className="App">
      <header className="Header">
        <div className="header-inner">
          <h3 className="NameWeb">OfficeMart Admin</h3>
        </div>
      </header>
      <main className="Content">
        {inRouter ? (
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/products/:id/edit" element={<ProductEditPage />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        ) : (
          <ProductListPage />
        )}
      </main>
    </div>
  );
}
