import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient.js';

export default function ProductForm({
  initialValues = {
    name: '',
    sku: '',
    category: '',
    price: '',
    stock: '',
    status: 'active',
  },
  onSubmit,
  isEdit = false,
  productId = null,
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Điền dữ liệu khi initialValues thay đổi (ở màn sửa)
  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name ?? '',
        sku: initialValues.sku ?? '',
        category: initialValues.category ?? '',
        price: initialValues.price ?? '',
        stock: initialValues.stock ?? '',
        status: initialValues.status || 'active',
      });
    }
  }, [initialValues]);

  // Lấy các lựa chọn danh mục từ GET /api/categories
  useEffect(() => {
    let isMounted = true;
    api.get('/categories')
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh mục:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};

    // 1. name: Bắt buộc, 3 đến 100 ký tự sau khi bỏ khoảng trắng ở đầu và cuối
    const trimmedName = (form.name || '').trim();
    if (!trimmedName) {
      errs.name = 'Tên sản phẩm là bắt buộc';
    } else if (trimmedName.length < 3 || trimmedName.length > 100) {
      errs.name = 'Tên sản phẩm phải từ 3 đến 100 ký tự';
    }

    // 2. sku: Bắt buộc, đúng dạng ABC-1234: 3 chữ in hoa, dấu gạch ngang, 4 chữ số
    const trimmedSku = (form.sku || '').trim();
    const skuRegex = /^[A-Z]{3}-\d{4}$/;
    if (!trimmedSku) {
      errs.sku = 'Mã SKU là bắt buộc';
    } else if (!skuRegex.test(trimmedSku)) {
      errs.sku = 'SKU phải đúng dạng ABC-1234 (3 chữ in hoa, gạch ngang, 4 chữ số)';
    }

    // 3. category: Bắt buộc chọn
    if (!form.category || String(form.category).trim() === '') {
      errs.category = 'Vui lòng chọn danh mục';
    }

    // 4. price: Số lớn hơn 0
    if (form.price === '' || form.price === null || form.price === undefined) {
      errs.price = 'Giá sản phẩm là bắt buộc';
    } else {
      const numPrice = Number(form.price);
      if (isNaN(numPrice) || numPrice <= 0) {
        errs.price = 'Giá phải lớn hơn 0';
      }
    }

    // 5. stock: Số nguyên, không âm
    if (form.stock === '' || form.stock === null || form.stock === undefined) {
      errs.stock = 'Tồn kho là bắt buộc';
    } else {
      const numStock = Number(form.stock);
      if (isNaN(numStock) || !Number.isInteger(numStock) || numStock < 0) {
        errs.stock = 'Tồn kho phải là số nguyên không âm';
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Khoá nút khi chờ, tránh gửi lặp request

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // Không gọi API khi có lỗi
    }
    setErrors({});
    setServerError('');

    setSubmitting(true);
    try {
      const payload = {
        name: (form.name || '').trim(),
        sku: (form.sku || '').trim(),
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        status: form.status || 'active',
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else if (isEdit && productId) {
        await api.put(`/products/${productId}`, payload);
        navigate('/products', { state: { toast: 'Đã cập nhật sản phẩm' } });
      } else {
        const res = await api.post('/products', payload);
        navigate('/products', { state: { toast: 'Đã thêm sản phẩm', newProduct: res.data } });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // API trả 409 (sku trùng): hiển thị message của server ở field-error-sku, giữ nguyên dữ liệu đã nhập
        setErrors((prev) => ({
          ...prev,
          sku: err.response.data?.message || 'SKU đã tồn tại',
        }));
      } else if (err.response?.status === 400 && err.response.data?.field) {
        setErrors((prev) => ({
          ...prev,
          [err.response.data.field]: err.response.data.message,
        }));
      } else {
        setServerError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form data-testid="product-form" onSubmit={handleSubmit} noValidate className="product-form">
      {serverError && (
        <div data-testid="error-message" className="form-server-error">
          {serverError}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name">Tên sản phẩm *</label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Nhập tên sản phẩm"
          className={errors.name ? 'input-error' : ''}
        />
        {errors.name && (
          <div data-testid="field-error-name" className="field-error">
            {errors.name}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="sku">SKU *</label>
        <input
          id="sku"
          name="sku"
          type="text"
          value={form.sku}
          onChange={handleChange}
          placeholder="VD: ABC-1234"
          className={errors.sku ? 'input-error' : ''}
        />
        {errors.sku && (
          <div data-testid="field-error-sku" className="field-error">
            {errors.sku}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="category">Danh mục *</label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          className={errors.category ? 'input-error' : ''}
        >
          <option value="">-- Chọn danh mục --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <div data-testid="field-error-category" className="field-error">
            {errors.category}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="price">Giá (₫) *</label>
        <input
          id="price"
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          placeholder="VD: 1500000"
          className={errors.price ? 'input-error' : ''}
        />
        {errors.price && (
          <div data-testid="field-error-price" className="field-error">
            {errors.price}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="stock">Tồn kho *</label>
        <input
          id="stock"
          name="stock"
          type="number"
          value={form.stock}
          onChange={handleChange}
          placeholder="VD: 10"
          className={errors.stock ? 'input-error' : ''}
        />
        {errors.stock && (
          <div data-testid="field-error-stock" className="field-error">
            {errors.stock}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="status">Trạng thái</label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option value="active">Đang bán</option>
          <option value="inactive">Ngừng bán</option>
        </select>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={() => navigate('/products')}
        >
          Huỷ
        </button>
        <button
          type="submit"
          data-testid="submit-button"
          disabled={submitting}
          className="btn-submit"
        >
          {submitting ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}
