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
        this.uploadedFiles = new Set();
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
        try {
            if (!this.collection) {
                await this.initializeCollection();
            }

            // Validate documents
            const validDocuments = documents.filter(doc => {
                const isValid = doc && doc.text && doc.text.trim().length > 0;
                if (!isValid) {
                    console.log('Invalid document:', doc);
                }
                return isValid;
            });

            if (validDocuments.length === 0) {
                throw new Error('No valid documents to process');
            }

            // Extract text from documents
            const texts = validDocuments.map(doc => doc.text.trim());
            
            // Generate embeddings
            const embeddings = await this.embedder.generate(texts);
            
            // Store to vector database
            await this.collection.add({
                ids: validDocuments.map((_, i) => `doc_${Date.now()}_${i}`),
                embeddings,
                metadatas: validDocuments.map(doc => doc.metadata || {}),
                documents: texts
            });

            return {
                success: true,
                count: validDocuments.length
            };
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
            // Use LangChain to process documents
            const chunks = await parseDocument(file);
            
            // Generate embeddings and store
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
            
            // Generate query embedding
            const [queryEmbedding] = await this.embedder.generate(query);
            
            // Search for similar documents in vector database
            const results = await this.collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: k
            });

            return results.documents[0];  // Return most similar document
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

    async clearAllData() {
        try {
            console.log('Starting clearAllData...');
            if (!this.collection) {
                console.log('Initializing collection...');
                await this.initializeCollection();
            }

            console.log('Getting collection data...');
            const collectionData = await this.collection.get();
            console.log('Collection data:', collectionData);

            const ids = collectionData.ids;
            console.log('Found IDs:', ids);

            if (ids && ids.length > 0) {
                console.log('Deleting documents...');
                await this.collection.delete({
                    ids: ids
                });
                console.log('Documents deleted successfully');
            } else {
                console.log('No documents to delete');
            }

            this.uploadedFiles = new Set();
            console.log('File records cleared');

            return {
                success: true,
                message: 'All data cleared successfully',
                deletedCount: ids ? ids.length : 0
            };
        } catch (error) {
            console.error('Error in clearAllData:', error);
            throw new Error(`Failed to clear data: ${error.message}`);
        }
    }

    isFileUploaded(fileName) {
        return this.uploadedFiles.has(fileName);
    }

    recordFileUpload(fileName) {
        this.uploadedFiles.add(fileName);
    }
}

// Create singleton instance
const companyVectorStore = new CompanyVectorStore();
export default companyVectorStore;