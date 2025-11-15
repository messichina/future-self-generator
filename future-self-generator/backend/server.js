const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
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
app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // 1. 将上传的图片存储到 Vercel Blob，并获取公共URL
    const blob = await put('uploaded-image.png', req.file.buffer, {
      access: 'public',
    });
    console.log('图片已上传，URL:', blob.url);

    // 2. 构建发送给豆包API的请求体
    const requestBody = {
      model: "doubao-seedream-4-0-250828", // 使用示例中的模型
      prompt: "请根据这张照片，生成一张20年后的我的照片。", // 您可以自定义这个提示词
      image: [blob.url], // 关键：使用 Vercel Blob 返回的图片URL
      response_format: "url",
      size: "2K",
      // stream: true, // 如果您需要流式响应，可以打开这个，但处理会更复杂
    };

    // 3. 调用豆包API
    const apiResponse = await fetch(process.env.ARK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('豆包API调用失败:', apiResponse.status, errorText);
      return res.status(apiResponse.status).json({ error: '豆包API调用失败', details: errorText });
    }

    // 4. 处理豆包API的响应并返回给前端
    const data = await apiResponse.json();
    res.json(data);

  } catch (error) {
    console.error('服务器内部错误:', error);
    res.status(500).json({ error: '服务器内部错误', details: error.message });
  }
});


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

