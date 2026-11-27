import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import api from '../api/axiosClient.js';
import ProductTable from '../components/ProductTable.jsx';
import useProductSearch from '../hooks/useProductSearch.js';

export default function ProductListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc các tham số từ URL
  const urlQ = searchParams.get('q') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const urlStatus = searchParams.get('status') ?? '';
  const rawPage = searchParams.get('page');
  const urlPage = Math.max(1, parseInt(rawPage || '1', 10) || 1);

  // State cục bộ cho ô tìm kiếm để người dùng gõ mượt mà trước khi debounce
  const [searchInput, setSearchInput] = useState(urlQ);
  const [categories, setCategories] = useState([]);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Đồng bộ ô tìm kiếm khi URL thay đổi (ví dụ khi Back/Forward hoặc mở URL trực tiếp)
  useEffect(() => {
    setSearchInput(urlQ);
  }, [urlQ]);

  // Debounce 400ms: chỉ cập nhật URL và gọi API sau khi người dùng ngừng gõ 400ms
  useEffect(() => {
    if (searchInput.trim() === urlQ.trim()) return;

    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);
      const trimmed = searchInput.trim();
      if (trimmed) {
        nextParams.set('q', trimmed);
      } else {
        nextParams.delete('q');
      }
      nextParams.set('page', '1'); // Đổi từ khoá thì quay về trang 1
      setSearchParams(nextParams);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, urlQ, searchParams, setSearchParams]);

  // Hook gọi API có AbortController huỷ request cũ khi tham số thay đổi (Mục 4.3.4 c)
  const {
    data: products,
    total,
    loading,
    error,
    setData: setProducts,
  } = useProductSearch(
    {
      q: urlQ,
      category: urlCategory,
      status: urlStatus,
      page: urlPage,
      limit: 10,
    },
    refreshKey
  );

  // Tính tổng số trang (10 sản phẩm mỗi trang, tối thiểu 1 trang)
  const totalPages = Math.max(1, Math.ceil(total / 10));

  // Nhận thông báo toast từ trang thêm/sửa chuyển về
  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Tự ẩn toast sau 3.5 giây
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Tải danh mục từ API phục vụ bộ lọc và hiển thị tên danh mục
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Xử lý đổi danh mục: cập nhật URL và quay về trang 1
  const handleCategoryChange = (e) => {
    const val = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (val) {
      nextParams.set('category', val);
    } else {
      nextParams.delete('category');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Xử lý đổi trạng thái: cập nhật URL và quay về trang 1
  const handleStatusChange = (e) => {
    const val = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (val) {
      nextParams.set('status', val);
    } else {
      nextParams.delete('status');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Xử lý chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
  };

  // Xác nhận xoá sản phẩm
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setToast('Đã xoá sản phẩm');
      setProductToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi xoá sản phẩm');
    } finally {
      setIsDeleting(false);
    }
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="products-page">
      {/* Toast thông báo thành công */}
      {toast && (
        <div data-testid="toast" className="toast-notification">
          <span>{toast}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header trang và Nút thêm sản phẩm */}
      <div className="page-header">
        <h1 className="Products-List page-title">Sản phẩm</h1>
        <button
          type="button"
          className="Add-Product add-button"
          data-testid="add-button"
          onClick={() => navigate('/products/new')}
        >
          Thêm sản phẩm
        </button>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="filter-bar">
        <div className="filter-item search-box">
          <input
            type="text"
            data-testid="search-input"
            className="search-input"
            placeholder="Tìm theo tên hoặc SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <select
            data-testid="category-filter"
            className="filter-select category-filter"
            value={urlCategory}
            onChange={handleCategoryChange}
          >
            <option value="">Tất cả</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <select
            data-testid="status-filter"
            className="filter-select status-filter"
            value={urlStatus}
            onChange={handleStatusChange}
          >
            <option value="">Tất cả</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>
        </div>
      </div>

      {/* Trạng thái đang tải */}
      {loading && (
        <div data-testid="loading" className="state-container loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách sản phẩm...</p>
        </div>
      )}

      {/* Trạng thái lỗi và nút Thử lại */}
      {!loading && error && (
        <div className="state-container error-state">
          <div data-testid="error-message" className="error-message-text">
            {error}
          </div>
          <button
            type="button"
            data-testid="retry-button"
            className="retry-button"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Trạng thái không có sản phẩm nào */}
      {!loading && !error && products.length === 0 && (
        <div data-testid="empty-state" className="state-container empty-state">
          Không có sản phẩm nào
        </div>
      )}

      {/* Bảng sản phẩm */}
      {!loading && !error && products.length > 0 && (
        <>
          <ProductTable
            products={products}
            categoryMap={categoryMap}
            onEdit={(product) => navigate(`/products/${product.id}/edit`)}
            onDelete={(product) => setProductToDelete(product)}
          />

          {/* Vùng phân trang */}
          <div data-testid="pagination" className="pagination-bar">
            <button
              type="button"
              data-testid="page-prev"
              className="btn-page btn-prev"
              disabled={urlPage <= 1}
              onClick={() => handlePageChange(urlPage - 1)}
            >
              Trước
            </button>
            <span data-testid="page-current" className="page-current">
              {urlPage} / {totalPages}
            </span>
            <button
              type="button"
              data-testid="page-next"
              className="btn-page btn-next"
              disabled={urlPage >= totalPages}
              onClick={() => handlePageChange(urlPage + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}

      {/* Hộp thoại xác nhận xoá tự làm (confirm-dialog) */}
      {productToDelete && (
        <div className="modal-backdrop">
          <div data-testid="confirm-dialog" className="confirm-dialog">
            <h3 className="confirm-title">Xác nhận xoá sản phẩm</h3>
            <p className="confirm-message">
              Bạn có chắc chắn muốn xoá sản phẩm <strong>{productToDelete.name}</strong> ({productToDelete.sku}) không?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                data-testid="confirm-no"
                className="btn-dialog-cancel"
                onClick={() => setProductToDelete(null)}
              >
                Huỷ
              </button>
              <button
                type="button"
                data-testid="confirm-yes"
                disabled={isDeleting}
                className="btn-dialog-confirm"
                onClick={handleConfirmDelete}
              >
                {isDeleting ? 'Đang xoá...' : 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
