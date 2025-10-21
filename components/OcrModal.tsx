
import React, { useState, useEffect } from 'react';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (file: File) => Promise<string>;
}

const OcrModal: React.FC<OcrModalProps> = ({ isOpen, onClose, onExtract }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const currentUrl = imageUrl;
    // Cleanup function to revoke the object URL to prevent memory leaks
    return () => {
        if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
        }
    };
  }, [imageUrl]);

  const handleClose = () => {
    setImageFile(null);
    setImageUrl(null);
    setExtractedText('');
    setError(null);
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setExtractedText('');
      setError(null);
    } else {
      setError('Please select a valid image file.');
      setImageFile(null);
      setImageUrl(null);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files ? e.dataTransfer.files[0] : null);
  };

  const handleExtractClick = async () => {
    if (!imageFile) return;
    setIsExtracting(true);
    setExtractedText('');
    setError(null);
    try {
      const text = await onExtract(imageFile);
      setExtractedText(text);
    } catch (e) {
      console.error('OCR Extraction failed:', e);
      setError('Failed to extract text from the image. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    alert('Copied to clipboard!');
  };

  const handleClear = () => {
      setImageFile(null);
      setImageUrl(null);
      setExtractedText('');
      setError(null);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] border border-gray-800 rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg text-gray-100 font-semibold">Optical Character Recognition (OCR)</h2>
          <button onClick={handleClose} className="text-gray-500 font-bold text-2xl hover:text-white">
            &times;
          </button>
        </header>
        <main className="flex-grow p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div 
                className={`flex-grow border-2 border-dashed ${isDragging ? 'border-purple-500 bg-gray-900/50' : 'border-gray-700'} flex flex-col items-center justify-center text-center p-4 relative cursor-pointer rounded-md`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('ocr-file-input')?.click()}
            >
              <input 
                type="file" 
                id="ocr-file-input" 
                className="hidden" 
                accept="image/*"
                onChange={onFileInputChange}
              />
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" />
              ) : (
                <div className="text-gray-500">
                  <p className="text-3xl">+</p>
                  <p>Click to select or drag & drop image</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleExtractClick}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 transition-colors duration-200 w-full"
                    disabled={!imageFile || isExtracting}
                >
                    {isExtracting ? 'Extracting...' : 'Extract Text'}
                </button>
                <button
                    onClick={handleClear}
                    className="bg-gray-600 text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors duration-200"
                    disabled={isExtracting}
                >
                    Clear
                </button>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-200 font-medium">Extracted Text</h3>
                <button
                    onClick={handleCopyToClipboard}
                    className="text-blue-400 hover:underline text-sm"
                    disabled={!extractedText}
                >
                    Copy to Clipboard
                </button>
            </div>
            <textarea
              className="bg-gray-900 border border-gray-700 w-full p-2 text-gray-300 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 flex-grow resize-none"
              value={isExtracting ? "Processing image with Gemini..." : (error || extractedText)}
              readOnly
              aria-label="Extracted text output"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default OcrModal;