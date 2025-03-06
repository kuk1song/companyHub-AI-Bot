import geminiEmbedding from '../utils/GeminiEmbedding.js';
import companyVectorStore from './CompanyVectorStore.js';
import { ANSWER_TEMPLATE } from '../utils/promptTemplates.js';

class CompanyKnowledge {
    async answerQuestion(question) {
        try {
            console.log('Processing question:', question);

            // 获取相关文档
            const { documents, metadatas } = await companyVectorStore.queryDocuments(question);
            
            // 构建上下文
            const context = documents.join('\n\n');
            
            // 生成提示词
            const prompt = ANSWER_TEMPLATE
                .replace('{context}', context)
                .replace('{question}', question);

            // 生成答案
            const answer = await geminiEmbedding.generateContent(prompt);

            return {
                answer,
                sources: metadatas.map(meta => ({
                    fileName: meta.fileName,
                    fileType: meta.fileType,
                    processedAt: meta.processedAt
                }))
            };
        } catch (error) {
            console.error('Error answering question:', error);
            throw error;
        }
    }
}

export default new CompanyKnowledge();