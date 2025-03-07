import companyVectorStore from './CompanyVectorStore.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ANSWER_TEMPLATE, SUMMARY_TEMPLATE } from '../utils/promptTemplates.js';


class CompanyKnowledge {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
}

export default new CompanyKnowledge();