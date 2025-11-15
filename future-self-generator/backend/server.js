const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 配置multer用于文件上传
const upload = multer({ storage: multer.memoryStorage() });

// 豆包seeddream4.0 API配置
const DOUBAO_API_URL = process.env.DOUBAO_API_URL || 'https://api.doubao.com/v1/seeddream/generate';
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;

// 生成未来自己的API端点
app.post('/api/generate', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file || !req.body.profession) {
            return res.status(400).json({ error: '请提供照片和职业信息' });
        }

        const { profession } = req.body;
        const imagePath = req.file.path;

        // 将图片转换为base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // 构建提示词
        const prompt = `生成一张二十年后的照片，人物职业是${profession}，保持人物面部特征和身份的一致性，展现成熟稳重的气质，高质量照片，真实感强`;

        // 调用豆包seeddream4.0 API
        const response = await axios.post(DOUBAO_API_URL, {
            model: 'seeddream-4.0',
            prompt: prompt,
            image: `data:image/jpeg;base64,${base64Image}`,
            strength: 0.8,
            guidance_scale: 7.5,
            num_inference_steps: 50,
            seed: -1,
        }, {
            headers: {
                'Authorization': `Bearer ${DOUBAO_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // 获取生成的图片URL
        const generatedImageUrl = response.data.image_url;

        // 删除上传的临时文件
        fs.unlinkSync(imagePath);

        // 返回生成的图片URL
        res.json({ imageUrl: generatedImageUrl });

    } catch (error) {
        console.error('生成失败:', error.response?.data || error.message);
        
        // 删除上传的临时文件（如果存在）
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            error: '生成失败', 
            details: error.response?.data?.error || error.message 
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
