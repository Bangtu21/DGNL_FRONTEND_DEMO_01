import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient.js';
import ProductForm from '../components/ProductForm.jsx';

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);
    setError(null);

    api.get(`/products/${id}`)
      .then((res) => {
        if (isMounted) {
          setProduct(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (err.response?.status === 404) {
            setNotFound(true);
          } else {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải sản phẩm');
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div data-testid="loading" className="state-container loading-state">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu sản phẩm...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="state-container not-found-state">
        <h2 className="not-found-title">Không tìm thấy sản phẩm</h2>
        <p>Sản phẩm có mã ID #{id} không tồn tại hoặc đã bị xoá.</p>
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate('/products')}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-container error-state">
        <div data-testid="error-message" className="error-message-text">
          {error}
        </div>
        <button
          type="button"
          data-testid="retry-button"
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <h1 className="page-title">Sửa sản phẩm</h1>
      </div>
      <div className="form-card">
        <ProductForm isEdit={true} productId={id} initialValues={product} />
      </div>
    </div>
  );
}
