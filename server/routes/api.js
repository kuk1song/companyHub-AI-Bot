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
            return res.status(400).json({ error: 'No file provided' });
        }

        // Process document
        const chunks = await processDocument(req.file);
        // console.log(chunks[2])
        
        // 
        await companyVectorStore.addDocuments(chunks);

        res.json({
            success: true,
            chunks: chunks.length,
            metadata: {
                fileName: req.file.originalname,
                processedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 查询知识
router.post('/query', async (req, res) => {
    try {
        const { question } = req.body;
        const answer = await companyKnowledge.answerQuestion(question);
        res.json(answer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取统计信息
router.get('/stats', async (req, res) => {
    try {
        console.log('Stats endpoint hit');  // 调试日志
        const stats = await companyVectorStore.getStats();
        console.log('Retrieved stats:', stats);  // 调试日志
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 添加一个简单的测试端点
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

export default router;