import { ChromaClient } from 'chromadb';
import geminiEmbedding from '../utils/GeminiEmbedding.js';
import { parseDocument } from '../utils/documentParser.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class CompanyVectorStore {
    constructor() {
        this.DB_NAME = "company_knowledge_db";
        this.embedFunction = geminiEmbedding;
        try {
            this.client = new ChromaClient({
                path: "http://localhost:8000"
            });
            console.log('ChromaDB client initialized');
        } catch (error) {
            console.error('ChromaDB client initialization error:', error);
            throw error;
        }
        this.initializeCollection();
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    async initializeCollection() {
        try {
            this.collection = await this.client.getOrCreateCollection({
                name: "company_docs",
                metadata: {
                    "description": "Company documents collection"
                }
            });
            console.log('Collection initialized successfully');
        } catch (error) {
            console.error('Collection initialization error:', error);
            throw error;
        }
    }

    async addDocuments(documents) {
        const embeddings = await this.generateEmbeddings(documents);
        await this.collection.add({
            ids: documents.map((_, i) => `doc_${Date.now()}_${i}`),
            embeddings,
            documents: documents.map(doc => doc.pageContent)
        });
    }

    async similaritySearch(query) {
        const queryEmbedding = await this.generateEmbedding(query);
        return await this.collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: 5
        });
    }

    async storeDocument(file) {
        try {
            // 使用 LangChain 处理文档
            const chunks = await parseDocument(file);
            
            // 生成嵌入并存储
            const embeddings = await Promise.all(
                chunks.map(chunk => this.genAI.embedContent(chunk.text))
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
            if (!this.collection) {
                await this.initializeCollection();
            }
            const count = await this.collection.count();
            return {
                documentCount: count || 0,
                lastUpdated: new Date().toISOString(),
                status: 'active'
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                documentCount: 0,
                lastUpdated: null,
                status: 'error',
                error: error.message
            };
        }
    }
}

// 创建单例实例
const companyVectorStore = new CompanyVectorStore();
export default companyVectorStore;