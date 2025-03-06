import express from 'express';
import multer from 'multer';
import companyVectorStore from '../services/CompanyVectorStore.js';
import companyKnowledge from '../services/CompanyKnowledge.js';
import { processDocument } from '../services/CompanyVectorStore.js';

const router = express.Router();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 上传文档
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // 处理文档
        const chunks = await processDocument(req.file);
        
        // 存储到向量数据库
        await companyVectorStore.storeDocument(chunks);

        res.json({
            success: true,
            chunks: chunks.length,
            metadata: {
                fileName: req.file.originalname,
                processedAt: new Date().toISOString()
            }
        });
    } catch (error) {
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
        const stats = await companyVectorStore.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;