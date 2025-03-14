import express from 'express';
import multer from 'multer';
import { processDocument } from '../utils/documentParser.js';
import companyVectorStore from '../services/CompanyVectorStore.js';
import companyKnowledge from '../services/CompanyKnowledge.js';

const router = express.Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('File received:', {
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size
        });

        const result = await companyKnowledge.processDocument(req.file);
        res.json(result);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack,
            file: req.file ? {
                name: req.file.originalname,
                type: req.file.mimetype
            } : 'No file'
        });
    }
});


router.post('/query', async (req, res) => {
    try {
        const { question } = req.body;
        const answer = await companyKnowledge.answerQuestion(question);
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get statistics info
router.get('/stats', async (req, res) => {
    try {
        console.log('Stats endpoint hit');  
        const stats = await companyVectorStore.getStats();
        console.log('Retrieved stats:', stats);  
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});


router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Answer question
router.post('/question', async (req, res) => {
    try {
        const { question } = req.body;
        const answer = await companyKnowledge.answerQuestion(question);
        res.json({ answer });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});


// Clear all data
router.post('/clear-data', async (req, res) => {
    try {
        const result = await companyKnowledge.clearAllData();
        res.json({
            success: true,
            message: 'All data cleared successfully',
            details: result
        });
    } catch (error) {
        console.error('Error in /clear-data:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear data'
        });
    }
});


export default router;