import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook để lấy và quản lý cấu hình hệ thống (Phí, Settings)
 * Giúp tránh việc hardcode các con số 8%, 10.000đ ở nhiều nơi.
 */
export const useSystemConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/config');
      if (response.data && response.data.data) {
        setConfig(response.data.data);
      } else {
        throw new Error('Không thể tải cấu hình');
      }
    } catch (err) {
      console.error('Error fetching system config:', err);
      setError(err.message);
      
      // Fallback values để UI không bị trống nếu API lỗi
      setConfig({
        event_platform_fee_percent: 5,
        event_transaction_fee_percent: 3,
        product_platform_fee_percent: 5,
        product_transaction_fee_percent: 3,
        system_gas_fee: 10000,
        resale_price_cap_percent: 8,
        resale_transaction_fee_percent: 1,
        default_royalty_percent: 3,
        withdrawal_fee_percent: 2,
        min_withdrawal_amount: 10000
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Helper functions để lấy giá trị nhanh
  const getFee = (key, fallback) => {
    if (!config || !config[key]) return fallback;
    return Number(config[key]);
  };

  return {
    config,
    loading,
    error,
    refresh: fetchConfig,
    // Phí platform
    eventPlatformFee: getFee('event_platform_fee_percent', 5),
    eventTransactionFee: getFee('event_transaction_fee_percent', 3),
    productPlatformFee: getFee('product_platform_fee_percent', 5),
    productTransactionFee: getFee('product_transaction_fee_percent', 3),
    // Marketplace & Resale
    resalePriceCap: getFee('resale_price_cap_percent', 8),
    resaleTransactionFee: getFee('resale_transaction_fee_percent', 1),
    royaltyFee: getFee('default_royalty_percent', 3),
    // Các phí khác
    gasFee: getFee('system_gas_fee', 10000),
    withdrawalFee: getFee('withdrawal_fee_percent', 2),
    minWithdrawal: getFee('min_withdrawal_amount', 10000),
  };
};
