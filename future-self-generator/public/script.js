document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const photoInput = document.getElementById('photoInput');
    const previewContainer = document.getElementById('previewContainer');
    const photoPreview = document.getElementById('photoPreview');
    const changePhotoBtn = document.getElementById('changePhoto');
    const professionInput = document.getElementById('professionInput');
    const generateBtn = document.getElementById('generateBtn');
    const loading = document.getElementById('loading');
    const resultSection = document.getElementById('resultSection');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    
    let uploadedImage = null;
    
    // 上传区域点击事件
    uploadArea.addEventListener('click', () => {
        photoInput.click();
    });
    
    // 更换照片按钮点击事件
    changePhotoBtn.addEventListener('click', () => {
        photoInput.click();
    });
    
    // 文件选择事件
    photoInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#e8f4fc';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '#f8f9fa';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f8f9fa';
        
        if (e.dataTransfer.files.length) {
            photoInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });
    
    // 处理文件选择
    function handleFileSelect() {
        const file = photoInput.files[0];
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                uploadedImage = e.target.result;
                photoPreview.src = uploadedImage;
                uploadArea.style.display = 'none';
                previewContainer.style.display = 'block';
                checkGenerateButton();
            };
            
            reader.readAsDataURL(file);
        } else {
            alert('请选择有效的图片文件');
        }
    }
    
    // 检查是否可以启用生成按钮
    function checkGenerateButton() {
        if (uploadedImage && professionInput.value.trim()) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
        }
    }
    
    // 职业输入事件
    professionInput.addEventListener('input', checkGenerateButton);
    
    // 生成按钮点击事件
    generateBtn.addEventListener('click', generateFutureSelf);
    
    // 重新生成按钮点击事件
    regenerateBtn.addEventListener('click', generateFutureSelf);
    
    // 生成未来自己
    async function generateFutureSelf() {
        const profession = professionInput.value.trim();
        
        if (!uploadedImage || !profession) {
            alert('请上传照片并输入期望的职业');
            return;
        }
        
        // 显示加载状态
        loading.style.display = 'block';
        resultSection.style.display = 'none';
        
        try {
            // 创建FormData对象
            const formData = new FormData();
            
            // 将base64图片转换为Blob
            const blob = dataURLtoBlob(uploadedImage);
            formData.append('photo', blob, 'photo.jpg');
            formData.append('profession', profession);
            
            // 发送请求到后端
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('生成失败，请稍后重试');
            }
            
            const data = await response.json();
            
            // 显示结果
            resultImage.src = data.imageUrl;
            loading.style.display = 'none';
            resultSection.style.display = 'block';
            
            // 设置下载链接
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = data.imageUrl;
                link.download = `future-self-${Date.now()}.jpg`;
                link.click();
            };
            
        } catch (error) {
            console.error('生成失败:', error);
            alert('生成失败: ' + error.message);
            loading.style.display = 'none';
        }
    }
    
    // 将base64转换为Blob
    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
});
