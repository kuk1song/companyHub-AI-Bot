import companyVectorStore from './CompanyVectorStore.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ANSWER_TEMPLATE, SUMMARY_TEMPLATE } from '../utils/promptTemplates.js';
import { parseDocument, splitIntoChunks } from '../utils/documentParser.js';
import geminiEmbedding from '../utils/GeminiEmbedding.js';

class CompanyKnowledge {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        this.vectorStore = companyVectorStore;
        this.embedder = new geminiEmbedding();
        this.documentParser = { parseDocument, splitIntoChunks };
    }

    async answerQuestion(question) {
        try {
            // 1. 获取相关文档
            const relevantDocs = await companyVectorStore.queryDocuments(question);
            
            // 2. 使用模板构建提示词
            const context = relevantDocs.join('\n\n');
            const prompt = ANSWER_TEMPLATE
                .replace('{context}', context)
                .replace('{question}', question);

            const completion = await this.model.generateContent(prompt);

            return completion.response.text();
        } catch (error) {
            console.error('Error in answerQuestion:', error);
            return "I apologize, but I encountered an error while processing your question. Please try again.";
        }
    }

    // 添加文档摘要方法
    async summarizeDocument(content) {
        try {
            // 使用 SUMMARY_TEMPLATE 生成摘要
            const prompt = SUMMARY_TEMPLATE.replace('{content}', content);
            
            console.log('Generating document summary...');
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error generating summary:', error);
            throw error;
        }
    }

    async processDocument(file) {
        const fileName = file.originalname;
        
        // Check if file was already uploaded
        if (this.vectorStore.isFileUploaded(fileName)) {
            throw new Error('This file has already been uploaded');
        }

        try {
            console.log('Processing document:', fileName);
            
            // Parse document
            const { content, metadata } = await this.documentParser.parseDocument(file);
            console.log('Document parsed successfully');

            // Split into chunks
            const chunks = await this.documentParser.splitIntoChunks(content);
            console.log(`Split into ${chunks.length} chunks`);

            // Add documents to vector store
            await this.vectorStore.addDocuments(chunks.map(chunk => ({
                text: chunk,
                metadata: {
                    ...metadata,
                    chunkIndex: chunks.indexOf(chunk)
                }
            })));

            // Record the file upload
            this.vectorStore.recordFileUpload(fileName);

            return { 
                success: true, 
                message: 'Document processed successfully',
                chunks: chunks.length,
                metadata
            };
        } catch (error) {
            console.error('Error processing document:', error);
            throw error;
        }
    }

    // Add clear data method
    async clearAllData() {
        try {
            const result = await companyVectorStore.clearAllData();
            if (!result.success) {
                throw new Error(result.message || 'Failed to clear data');
            }
            return result;
        } catch (error) {
            console.error('Error in clearAllData:', error);
            throw new Error(`Failed to clear data: ${error.message}`);
        }
    }
}

export default new CompanyKnowledge();