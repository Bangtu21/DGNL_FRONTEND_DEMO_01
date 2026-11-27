import React from 'react';
import ProductForm from '../components/ProductForm.jsx';

export default function ProductCreatePage() {
  return (
    <div className="form-page">
      <div className="form-header">
        <h1 className="page-title">Thêm sản phẩm</h1>
      </div>
      <div className="form-card">
        <ProductForm isEdit={false} />
      </div>
    </div>
  );
}
