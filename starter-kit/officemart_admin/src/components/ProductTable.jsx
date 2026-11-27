import React from 'react';
import ProductRow from './ProductRow.jsx';

export default function ProductTable({ products = [], categoryMap, onEdit, onDelete }) {
  return (
    <div className="table-responsive">
      <table data-testid="product-table" className="product-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>SKU</th>
            <th>Danh mục</th>
            <th>Giá</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id ?? product.sku}
              product={product}
              categoryMap={categoryMap}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
