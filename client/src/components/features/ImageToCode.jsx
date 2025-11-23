import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiImage, FiX, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ImageToCode = ({ onCodeGenerated }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Compress and resize image
  const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview and compress
    try {
      const compressedPreview = await compressImage(file, 800, 600, 0.7);
      setImagePreview(compressedPreview);
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback to original
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsProcessing(true);
    toast.loading('Compressing and analyzing image...', { id: 'image-to-code' });

    try {
      // Compress image before sending (max 1920x1080, 80% quality)
      const compressedImage = await compressImage(selectedImage, 1920, 1080, 0.8);
      
      // Check size (base64 is ~33% larger than binary)
      const sizeInMB = (compressedImage.length * 3) / 4 / 1024 / 1024;
      if (sizeInMB > 5) {
        // Further compress if still too large
        toast.loading('Further compressing image...', { id: 'image-to-code' });
        const furtherCompressed = await compressImage(selectedImage, 1280, 720, 0.6);
        var base64Image = furtherCompressed;
      } else {
        var base64Image = compressedImage;
      }
      
      toast.loading('Analyzing image and generating code...', { id: 'image-to-code' });

      // Extract MIME type from base64 data URL
      const mimeTypeMatch = base64Image.match(/data:([^;]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      // Use dedicated image-to-code endpoint with proper vision API
      const res = await fetch(`${apiBase}/image-to-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: mimeType,
          model: 'gemini-2.5-flash'
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const cleaned = extractCodeBlock(data.code || '');

      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error('No code generated from image');
      }

      onCodeGenerated(cleaned);
      toast.success('Image converted to code successfully!', { id: 'image-to-code' });

    } catch (error) {
      console.error('Image processing error:', error);
      let errorMessage = 'Failed to convert image to code. ';
      if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
        errorMessage += 'Image is too large. Please try a smaller image or compress it first.';
      } else if (error.message.includes('HTTP')) {
        errorMessage += `Server error: ${error.message}`;
      } else {
        errorMessage += 'Please try again.';
      }
      toast.error(errorMessage, { id: 'image-to-code', duration: 5000 });
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract code block from AI response
  const extractCodeBlock = (text) => {
    if (!text) return '';

    // Look for code blocks
    const codeBlockRegex = /```(?:javascript|jsx|js)?\n?([\s\S]*?)```/g;
    const matches = text.match(codeBlockRegex);

    if (matches) {
      const match = matches[0].match(/```(?:javascript|jsx|js)?\n?([\s\S]*?)```/);
      if (match) return match[1].trim();
    }

    // If no code blocks, try to find window.MainComponent assignment
    if (text.includes('window.MainComponent')) {
      return text.trim();
    }

    // Try to extract JSX/React code
    if (text.includes('React') || text.includes('JSX') || text.includes('function') || text.includes('const') || text.includes('export')) {
      return text.trim();
    }

    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <FiImage className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Image-to-Code</h3>
          <p className="text-sm text-gray-400">Upload a design image and convert it to code</p>
        </div>
      </div>

      <div className="space-y-4">
        {!imagePreview ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">Drop your design image here</h4>
            <p className="text-gray-400 mb-4">or click to browse files</p>
            <p className="text-xs text-gray-500">Supports PNG, JPG, JPEG, WebP (max 10MB)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Selected Image:</span>
                <button
                  onClick={removeImage}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <FiX className="w-4 h-4 text-red-400" />
                </button>
              </div>
              <img
                src={imagePreview}
                alt="Selected design"
                className="w-full h-48 object-contain rounded border border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-2">{selectedImage?.name}</p>
            </div>

            <motion.button
              onClick={processImage}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing Image...
                </>
              ) : (
                <>
                  <FiZap className="w-5 h-5" />
                  Generate Code from Image
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Upload screenshots of websites, app designs, or wireframes to convert them to React code</p>
      </div>
    </motion.div>
  );
};

export default ImageToCode;
