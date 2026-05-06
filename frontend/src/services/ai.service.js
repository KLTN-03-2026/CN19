import axios from 'axios';

const AI_API_URL = 'http://localhost:5001';

export const aiService = {
    // Gửi tin nhắn tới trợ lý ảo
    chat: async (message, context = {}) => {
        try {
            const response = await axios.post(`${AI_API_URL}/chat`, {
                message,
                context
            });
            return response.data;
        } catch (error) {
            console.error('AI Chat Error:', error);
            throw error;
        }
    }
};
