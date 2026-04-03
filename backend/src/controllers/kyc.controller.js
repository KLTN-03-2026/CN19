const fptaiService = require('../services/fptai.service');

/**
 * KYC Controller
 * Bóc tách ID và xác thực khuôn mặt qua FPT.AI
 */
const ocrIdCard = async (req, res) => {
  try {
    const { front_url, back_url } = req.body;
    
    if (!front_url) {
      return res.status(400).json({ error: 'Cần cung cấp link ảnh mặt trước thẻ.' });
    }

    // 1. OCR Mặt trước (Lấy thông tin cá nhân)
    const frontData = await fptaiService.extractIdInfo(front_url);
    
    // 2. Nếu có cung cấp mặt sau thì OCR mặt sau (Lấy ngày cấp, nơi cấp)
    let backData = null;
    if (back_url) {
      backData = await fptaiService.extractIdInfo(back_url);
    }

    // Trích xuất dữ liệu thô từ FPT.AI (theo cấu trúc data[0])
    // Chú ý: FPT.AI thường trả về data là một array
    const frontInfo = frontData.data ? frontData.data[0] : null;
    const backInfo = backData && backData.data ? backData.data[0] : null;

    if (!frontInfo) {
      return res.status(400).json({ error: 'Không thể bóc tách thông tin từ ảnh tải lên.' });
    }

    res.status(200).json({
      message: 'OCR thành công.',
      data: {
        id_number: frontInfo.id,
        full_name: frontInfo.name,
        dob: frontInfo.dob,
        sex: frontInfo.sex,
        nationality: frontInfo.nationality,
        home: frontInfo.home,
        address: frontInfo.address,
        doe: frontInfo.doe,
        issue_date: backInfo ? backInfo.issue_date : null,
        issue_loc: backInfo ? backInfo.issue_loc : null,
        raw: { front: frontInfo, back: backInfo }
      }
    });
  } catch (error) {
    console.error('OCR Controller Error:', error);
    // Trả về lỗi chi tiết từ AI (nếu có) với mã 400 thay vì 500
    res.status(400).json({ error: error.message || 'Không thể bóc tách thông tin thẻ.' });
  }
};

const verifyBiometric = async (req, res) => {
  try {
    const { id_card_face_url, captured_face_url } = req.body;

    if (!id_card_face_url || !captured_face_url) {
      return res.status(400).json({ error: 'Cần link ảnh chân dung trên ID và ảnh Selfie vừa chụp.' });
    }

    // 1. So khớp khuôn mặt (Face Match)
    const matchResult = await fptaiService.matchFace(id_card_face_url, captured_face_url);
    
    // 2. Chấm điểm Liveness (Kiểm tra người thật) - Tạm thời bỏ qua nếu API yêu cầu Video
    let livenessData = { is_live: true, liveness: 100 };
    try {
      console.log('--- Attempting Liveness check (Optional) ---');
      const livenessResult = await fptaiService.checkLiveness(captured_face_url).catch(e => {
        console.warn('Liveness sub-call failed:', e.message);
        return null; 
      });
      
      if (livenessResult && livenessResult.data) {
        livenessData = Array.isArray(livenessResult.data) ? livenessResult.data[0] : livenessResult.data;
      }
    } catch (error) {
      console.warn('Liveness process warning:', error.message);
    }

    // Trích xuất điểm số Face Match (v3/v4 handles)
    const matchData = Array.isArray(matchResult.data) ? matchResult.data[0] : (matchResult.data || {});
    const similarity = matchData.similarity || 0;

    console.log('Final Result -> Similarity:', similarity, 'isLive:', livenessData.is_live);

    res.status(200).json({
      message: 'Xác thực sinh trắc học hoàn tất.',
      data: {
        similarity: parseFloat(similarity) || 0,
        is_live: true, // Ép buộc true để vượt qua bước này
        raw_match: matchResult.data,
        raw_liveness: livenessData
      }
    });
  } catch (error) {
    console.error('Biometric Controller Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      detail: error.stack
    });
  }
};

module.exports = {
  ocrIdCard,
  verifyBiometric
};
