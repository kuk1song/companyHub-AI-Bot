// import pdf from 'pdf-parse';
// import mammoth from 'mammoth';
import { marked } from 'marked';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function parseDocument(file) {
    if (!file || !file.buffer) {
        throw new Error('Invalid file input');
    }

    const { buffer, mimetype: type, originalname: name } = file;
    let content = '';
    let metadata = {
        fileName: name,
        fileType: type,
        processedAt: new Date().toISOString()
    };

    try {
        switch (type) {
            case 'application/pdf':
                try {
                    // 打印调试信息
                    console.log('Starting PDF parse...');
                    
                    // 动态导入 pdf-parse
                    const pdfParse = await import('pdf-parse');
                    
                    // 确保使用 .default
                    const pdfData = await pdfParse.default(buffer);
                    
                    console.log('PDF parsed successfully');
                    
                    content = pdfData.text;
                    metadata = {
                        ...metadata,
                        pageCount: pdfData.numpages,
                        author: pdfData.info?.Author,
                        creationDate: pdfData.info?.CreationDate
                    };
                } catch (pdfError) {
                    console.error('PDF parsing error:', pdfError);
                    throw new Error(`PDF parsing failed: ${pdfError.message}`);
                }
                break;

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                const { value } = await mammoth.extractRawText({ buffer });
                content = value;
                break;

            case 'text/markdown':
            case 'text/plain':
                content = buffer.toString();
                break;

            default:
                throw new Error(`Unsupported file type: ${type}`);
        }

        if (!content) {
            throw new Error('No content extracted from file');
        }

        content = content
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,?!-]/g, '')
            .trim();

        return { content, metadata };
    } catch (error) {
        console.error('Document parsing error:', error);
        throw new Error(`Failed to parse document: ${error.message}`);
    }
}

// 完整的解析方案
export async function processDocument(file) {
    // 1. 使用 LangChain 加载 PDF
    const loader = new PDFLoader(file, {
        splitPages: true,
        parsedItemSeparator: '\n'
    });
    
    // 2. 使用 LangChain 的文本分割器
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", ".", "!", "?"]
    });

    // 3. 处理文档
    const docs = await loader.load();
    const chunks = await splitter.splitDocuments(docs);

    return chunks;
}