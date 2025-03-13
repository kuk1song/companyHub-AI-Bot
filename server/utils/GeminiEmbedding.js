import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiEmbedding {
    constructor() {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = genAI.getGenerativeModel({ model: "text-embedding-004" });
            console.log('Gemini Embedding model initialized');
        } catch (error) {
            console.error('Gemini initialization error:', error);
            throw error;
        }
    }

    async generateEmbedding(text) {  // Single text embedding generation
        try {
            const result = await this.model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            console.error('Embedding generation error:', error);
            throw error;
        }
    }

    async generate(texts) {  // Batch text embedding generation
        try {
            console.log('Generating embeddings for', Array.isArray(texts) ? texts.length : 1, 'texts');
            
            if (!Array.isArray(texts)) {
                texts = [texts];
            }

            const embeddings = await Promise.all(
                texts.map(text => this.generateEmbedding(text))
            );

            console.log('Successfully generated embeddings');
            return embeddings;
        } catch (error) {
            console.error('Error in batch embedding generation:', error);
            throw error;
        }
    }
}

export default GeminiEmbedding;