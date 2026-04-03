const FormData = require('form-data');
const axios = require('axios');

/**
 * FPT.AI eKYC Service
 * Tài liệu: https://docs.fpt.ai/
 */
class FptAiService {
  constructor() {
    this.apiKey = process.env.FPT_AI_API_KEY;
    this.baseUrl = 'https://api.fpt.ai/vision';
  }

  /**
   * Bóc tách thông tin thẻ CCCD/CMND (OCR)
   * @param {string} imageUrl - Link ảnh mặt trước hoặc mặt sau
   */
  async extractIdInfo(imageUrl) {
    try {
      // FPT.AI OCR /idr/vnm endpoint often prefers x-www-form-urlencoded or multipart for image_url
      const params = new URLSearchParams();
      params.append('image_url', imageUrl);

      const response = await axios.post(
        `${this.baseUrl}/idr/vnm`,
        params.toString(),
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('FPT.AI Raw Response:', response.data);

      if (response.data && response.data.errorCode !== 0) {
        throw new Error(response.data.message || response.data.errorMessage || 'Lỗi bóc tách thông tin thẻ.');
      }
      return response.data;
    } catch (error) {
      console.error('FPT.AI OCR Error Details:', error.response?.data || error.message);
      const apiMsg = error.response?.data?.message || error.response?.data?.errorMessage;
      throw new Error(apiMsg || error.message || 'Lỗi kết nối dịch vụ bóc tách.');
    }
  }

  /**
   * So khớp khuôn mặt (Face Match) giữa ảnh CCCD và ảnh selfie
   * @param {string} targetUrl - Link ảnh chân dung trên CCCD
   * @param {string} sourceUrl - Link ảnh selfie vừa chụp
   */
  async matchFace(targetUrl, sourceUrl) {
    try {
      // Chuẩn eKYC v4 của FPT
      const endpoint = 'https://api.fpt.ai/vision/ekyc/facematch/v4/';
      
      const [targetRes, sourceRes] = await Promise.all([
        axios.get(targetUrl, { responseType: 'arraybuffer' }),
        axios.get(sourceUrl, { responseType: 'arraybuffer' })
      ]);

      const form = new FormData();
      // v4 yêu cầu dùng chung key 'file[]' cho cả 2 ảnh
      form.append('file[]', Buffer.from(targetRes.data), { filename: 'target.jpg', contentType: 'image/jpeg' });
      form.append('file[]', Buffer.from(sourceRes.data), { filename: 'source.jpg', contentType: 'image/jpeg' });

      console.log('--- Calling Face Match v4 (Multipart file[]) ---', endpoint);
      const response = await axios.post(
        endpoint,
        form,
        {
          headers: {
            'api-key': this.apiKey,
            ...form.getHeaders()
          }
        }
      );
      
      console.log('Face Match v4 Response:', response.data);

      const statusValue = response.data?.errorCode ?? response.data?.code;
      const isSuccess = Number(statusValue) === 0 || Number(statusValue) === 200 || response.data?.isMatch !== undefined;

      if (response.data && !isSuccess) {
        throw new Error(response.data.message || response.data.errorMessage || `Lỗi FaceMatch (Code: ${statusValue})`);
      }
      return response.data;
    } catch (error) {
      console.error('FPT.AI FaceMatch Error Detail:', error.response?.data || error.message);
      const apiData = error.response?.data;
      const apiMsg = apiData?.message || apiData?.errorMessage || error.message;
      throw new Error(apiMsg || 'Lỗi kết nối dịch vụ so khớp v4.');
    }
  }

  /**
   * Kiểm tra thực thể sống (Liveness Detection - Static)
   * @param {string} imageUrl - Link ảnh selfie vừa chụp
   */
  async checkLiveness(imageUrl) {
    try {
      // v3 Liveness nằm ở prefix /dmp/
      const endpoint = 'https://api.fpt.ai/dmp/liveness/v3';
      
      const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      const form = new FormData();
      form.append('image', Buffer.from(imgRes.data), { filename: 'liveness.jpg', contentType: 'image/jpeg' });

      console.log('--- Calling Liveness v3 (Multipart image) ---', endpoint);
      const response = await axios.post(
        endpoint,
        form,
        {
          headers: {
            'api-key': this.apiKey,
            ...form.getHeaders()
          }
        }
      );

      console.log('Liveness v3 Response:', response.data);

      if (response.data && response.data.errorCode !== 0 && response.data.errorCode !== '0') {
        throw new Error(response.data.message || response.data.errorMessage || `Lỗi Liveness (Code: ${response.data.errorCode})`);
      }
      return response.data;
    } catch (error) {
      console.error('FPT.AI Liveness Error Detail:', error.response?.data || error.message);
      const apiData = error.response?.data;
      const apiMsg = apiData?.message || apiData?.errorMessage || error.message;
      throw new Error(apiMsg || 'Lỗi hệ thống kiểm tra khuôn mặt v3.');
    }
  }
}

module.exports = new FptAiService();
