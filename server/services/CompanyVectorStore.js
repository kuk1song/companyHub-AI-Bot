import { ChromaClient } from 'chromadb';
import geminiEmbedding from '../utils/GeminiEmbedding.js';
import { parseDocument } from '../utils/documentParser.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

class CompanyVectorStore {
    constructor() {
        this.DB_NAME = "company_knowledge_db";
        this.embedFunction = geminiEmbedding;
        this.client = new ChromaClient({
            path: "http://localhost:8000"
        });
        this.embedder = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.initializeDB();
    }

    async initializeDB() {
        try {
            try {
                this.collection = await this.client.getCollection({
                    name: this.DB_NAME,
                    embeddingFunction: this.embedFunction
                });
                console.log('Using existing collection');
            } catch (error) {
                this.collection = await this.client.createCollection({
                    name: this.DB_NAME,
                    embeddingFunction: this.embedFunction
                });
                console.log('Created new collection');
            }
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async storeDocument(file) {
        try {
            // 使用 LangChain 处理文档
            const chunks = await parseDocument(file);
            
            // 生成嵌入并存储
            const embeddings = await Promise.all(
                chunks.map(chunk => this.embedder.embedContent(chunk.text))
            );

            await this.collection.add({
                ids: chunks.map((_, i) => `doc_${Date.now()}_${i}`),
                embeddings,
                documents: chunks.map(c => c.text),
                metadatas: chunks.map(c => c.metadata)
            });

            return { success: true };
        } catch (error) {
            throw new Error(`Storage failed: ${error.message}`);
        }
    }

    async queryDocuments(question, limit = 5) {
        try {
            const queryEmbedding = await this.embedFunction.generate(question);
            
            const results = await this.collection.query({
                queryEmbeddings: queryEmbedding,
                nResults: limit,
                include: ["documents", "metadatas", "distances"]
            });

            return {
                documents: results.documents[0],
                metadatas: results.metadatas[0],
                distances: results.distances[0]
            };
        } catch (error) {
            console.error('Error querying documents:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const result = await this.collection.get();
            const documentTypes = {};
            
            result.metadatas.forEach(meta => {
                const type = meta.fileType;
                documentTypes[type] = (documentTypes[type] || 0) + 1;
            });

            return {
                totalDocuments: result.ids.length,
                documentTypes,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }
}

export default new CompanyVectorStore();