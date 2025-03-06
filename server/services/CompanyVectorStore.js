import { ChromaClient } from 'chromadb';
import geminiEmbedding from '../utils/GeminiEmbedding.js';
import { parseDocument } from '../utils/documentParser.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class CompanyVectorStore {
    constructor() {
        this.DB_NAME = "company_knowledge_db";
        try {
            this.client = new ChromaClient({
                path: "http://localhost:8000"
            });
            this.embedder = new geminiEmbedding();
            console.log('ChromaDB and Embedding service initialized');
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

    async addDocuments(documents) {  // 注意是复数，表示处理多个文档
        try {
            if (!this.collection) {
                await this.initializeCollection();
            }

            // 验证文档
            const validDocuments = documents.filter(doc => {
                const isValid = doc && doc.text && doc.text.trim().length > 0;
                if (!isValid) {
                    console.log('Invalid document:', {
                        hasDoc: !!doc,
                        hasText: doc && !!doc.text,
                        textLength: doc && doc.text ? doc.text.trim().length : 0
                    });
                }
                return isValid;
            });
    
            console.log(`Valid documents: ${validDocuments.length} out of ${documents.length}`);
    
            if (validDocuments.length === 0) {
                throw new Error('No valid documents to process');
            }
    
            // 从文档中提取文本
            const texts = validDocuments.map(doc => doc.text.trim());
            console.log('Texts prepared for embedding:', texts.length);
            
            // 使用批量处理方法
            const embeddings = await this.embedder.generate(texts);  // 使用 generate 而不是 generateEmbedding
            
            // Store to vector database
            await this.collection.add({
                ids: validDocuments.map((_, i) => `doc_${Date.now()}_${i}`),
                embeddings,
                metadatas: validDocuments.map(doc => doc.metadata || {}),
                documents: texts
            });
            
            return true;
        } catch (error) {
            console.error('Error in addDocuments:', error);
            throw error;
        }
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

    async queryDocuments(query, k = 5) {
        try {
            if (!this.collection) {
                await this.initializeCollection();
            }

            console.log('Processing query:', query);
            
            // 生成查询的向量表示
            const [queryEmbedding] = await this.embedder.generate(query);
            
            // 在向量数据库中搜索相似文档
            const results = await this.collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: k
            });

            return results.documents[0];  // 返回最相似的文档
        } catch (error) {
            console.error('Error in queryDocuments:', error);
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