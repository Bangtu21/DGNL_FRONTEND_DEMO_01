import React from 'react';
import { categoryNames } from '../data/sample.js';

export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return '0 ₫';
  }
  return `${Number(price).toLocaleString('vi-VN')} ₫`;
}

export default function ProductRow({ product, categoryMap, onEdit, onDelete }) {
  if (!product) return null;

  const categoryName =
    categoryMap?.[product.category] ||
    categoryNames[product.category] ||
    product.category ||
    '';
  const isOutOfStock = product.stock === 0;
  const isStatusActive = product.status === 'active';

  return (
    <tr data-testid="product-row" className="product-row">
      <td data-label="Tên" className="col-name">
        <span className="cell-value product-name">{product.name}</span>
      </td>
      <td data-label="SKU" className="col-sku">
        <span className="cell-value product-sku">{product.sku}</span>
      </td>
      <td data-label="Danh mục" className="col-category">
        <span className="cell-value product-category">{categoryName}</span>
      </td>
      <td data-label="Giá" className="col-price">
        <span className="cell-value product-price">{formatPrice(product.price)}</span>
      </td>
      <td data-label="Tồn kho" className={`col-stock ${isOutOfStock ? 'stock-empty' : ''}`}>
        <span className="cell-value product-stock">
          {isOutOfStock ? (
            <span className="out-of-stock">Hết hàng</span>
          ) : (
            product.stock
          )}
        </span>
      </td>
      <td data-label="Trạng thái" className="col-status">
        <span className="cell-value product-status-wrap">
          <span
            data-testid="product-status"
            className={`status-badge ${isStatusActive ? 'status-active' : 'status-inactive'}`}
          >
            {isStatusActive ? 'Đang bán' : 'Ngừng bán'}
          </span>
        </span>
      </td>
      <td data-label="Thao tác" className="col-actions">
        <div className="action-buttons">
          <button
            type="button"
            className="btn-action btn-edit"
            data-testid="edit-button"
            onClick={() => onEdit?.(product)}
          >
            Sửa
          </button>
          <button
            type="button"
            className="btn-action btn-delete"
            data-testid="delete-button"
            onClick={() => onDelete?.(product)}
          >
            Xoá
          </button>
        </div>
      </td>
    </tr>
  );
}
