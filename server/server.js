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

// Test route
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Ensure API routes are mounted correctly
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Start server
const startServer = async () => {
    try {
        // Ensure ChromaDB connection is successful
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