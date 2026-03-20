// [Utility] Upload file ảnh 
const uploadImage = async (req, res) => {
  try {
    // Trong thực tế, Request sẽ chứa req.file thông qua Multer middleware.
    // Sau đó ta đẩy buffer lên AWS S3 hoặc Cloudinary. Lấy URL trả về.
    
    // Ở đây ta mock API response
    res.status(200).json({ 
      message: 'Upload file thành công.',
      url: 'https://cdn.basticket.com/mock-upload-file-' + Date.now() + '.jpg'
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi upload.' });
  }
};

module.exports = { uploadImage };
