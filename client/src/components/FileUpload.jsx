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
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            console.log('Upload result:', result);
        } catch (error) {
            console.error('Upload error:', error);
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