import api from '../../../services/api';

export const loginApi = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerApi = async ({ email, password, full_name, phone_number }) => {
  const response = await api.post('/auth/register', { email, password, full_name, phone_number });
  return response.data;
};
