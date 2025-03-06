import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiEmbedding {
    constructor() {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        this.llmModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async generate(texts) {
        try {
            if (!Array.isArray(texts)) {
                texts = [texts];
            }

            const chunks = await this.splitIntoChunks(texts);
            
            const embeddings = await Promise.all(
                chunks.map(async (chunk) => {
                    const result = await this.model.embedContent(chunk);
                    return result.embedding.values;
                })
            );

            return embeddings;
        } catch (error) {
            console.error('Error in GeminiEmbedding:', error);
            throw error;
        }
    }

    async generateContent(prompt) {
        try {
            const result = await this.llmModel.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('Error generating content:', error);
            throw error;
        }
    }

    async splitIntoChunks(texts, maxChunkSize = 500) {
        const chunks = [];
        for (let text of texts) {
            const sentences = text.split(/[.!?]+/);
            let currentChunk = '';
            
            for (let sentence of sentences) {
                if ((currentChunk + sentence).length < maxChunkSize) {
                    currentChunk += sentence + '. ';
                } else {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = sentence + '. ';
                }
            }
            if (currentChunk) chunks.push(currentChunk.trim());
        }
        return chunks;
    }
}

export default new GeminiEmbedding();