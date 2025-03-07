import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import companyVectorStore from './services/CompanyVectorStore.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置
app.use(cors());

// Body parser
app.use(express.json());

// 测试路由
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running' });
});

// 确保 API 路由正确挂载
app.use('/api', apiRoutes);

// 添加基本的错误处理
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
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