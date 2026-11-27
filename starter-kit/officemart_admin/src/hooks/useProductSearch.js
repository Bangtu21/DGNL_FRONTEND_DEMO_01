// Hook tải danh sách sản phẩm có huỷ request cũ bằng AbortController (Mục 4.3.4 c)
import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api/axiosClient.js';

export default function useProductSearch(params, refreshKey) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Tạo controller để huỷ request cũ khi tham số tìm kiếm / lọc / trang thay đổi
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const queryParams = {
          page: params.page || 1,
          limit: params.limit || 10,
        };
        if (params.q && params.q.trim()) {
          queryParams.q = params.q.trim();
        }
        if (params.category) {
          queryParams.category = params.category;
        }
        if (params.status) {
          queryParams.status = params.status;
        }

        const res = await api.get('/products', {
          params: queryParams,
          signal: controller.signal,
        });

        setData(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        // Bỏ qua lỗi do chính AbortController huỷ request
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return;
        }
        setError(err.response?.data?.message || err.message || 'Lỗi máy chủ, vui lòng thử lại');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    // Dọn dẹp: huỷ request cũ khi tham số đổi
    return () => {
      controller.abort();
    };
  }, [params.q, params.category, params.status, params.page, params.limit, refreshKey]);

  return { data, total, loading, error, setData, setTotal };
}
