import { useState } from 'react';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFileInfo({
                name: selectedFile.name,
                type: selectedFile.type,
                size: `${(selectedFile.size / 1024).toFixed(2)} KB`
            });
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        if (file.type !== 'application/pdf') {
            setError('Only PDF files are supported');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            console.log('Starting upload for:', file.name);
            
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
            });

            console.log('Upload response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSuccess('File uploaded and processed successfully!');
            console.log('Server response:', data);
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Upload PDF</h2>
            
            {fileInfo && (
                <div className="file-info">
                    <h3>Selected File:</h3>
                    <ul>
                        <li>Name: {fileInfo.name}</li>
                        <li>Type: {fileInfo.type}</li>
                        <li>Size: {fileInfo.size}</li>
                    </ul>
                </div>
            )}

            <form onSubmit={handleUpload}>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="input"
                />
                <button 
                    type="submit" 
                    className="button button-primary"
                    disabled={loading || !file}
                >
                    {loading ? 'Uploading...' : 'Upload'}
                </button>
            </form>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            
            {loading && (
                <div className="upload-status">
                    <p>Uploading file... Please wait.</p>
                </div>
            )}
        </div>
    );
};

export default FileUpload;