import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import companyVectorStore from './services/CompanyVectorStore.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for development
app.use(cors());

// Body parser
app.use(express.json());

// 测试路由
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running' });
});

// 确保 API 路由正确挂载
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// 启动服务器
const startServer = async () => {
    try {
        // 确保 ChromaDB 连接成功
        await companyVectorStore.initializeCollection();
        
        app.listen(PORT, () => {
            console.log('=================================');
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Accepting requests from http://localhost:5173`);
            console.log('ChromaDB connected successfully');
            console.log('=================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();