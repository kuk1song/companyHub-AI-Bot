// import pdf from 'pdf-parse';
// import mammoth from 'mammoth';
import { marked } from 'marked';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const parseDocument = async (file) => {
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
                    // 创建临时文件
                    const tempFilePath = join(tmpdir(), `temp_${Date.now()}.pdf`);
                    await writeFile(tempFilePath, buffer);
                    console.log('Temp PDF file created at:', tempFilePath);

                    // 使用 PDFLoader 加载文档
                    const loader = new PDFLoader(tempFilePath);
                    const docs = await loader.load();
                    
                    // 合并所有页面的内容
                    content = docs.map(doc => doc.pageContent).join('\n');
                    
                    // 清理临时文件
                    await unlink(tempFilePath);
                    console.log('Temp PDF file deleted');

                    metadata = {
                        ...metadata,
                        pageCount: docs.length
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
                content = buffer.toString('utf-8');
                break;

            default:
                throw new Error(`Unsupported file type: ${type}`);
        }

        if (!content) {
            throw new Error('No content extracted from file');
        }

        // 清理文本内容
        content = content
            .replace(/\s+/g, ' ')
            .trim();

        return { content, metadata };
    } catch (error) {
        console.error('Document parsing error:', error);
        throw new Error(`Failed to parse document: ${error.message}`);
    }
};

// 完整的解析方案
export async function processDocument(file) {
    if (!file || !file.buffer) {
        throw new Error('Invalid file input');
    }

    try {
        // 1. 保存临时文件（PDFLoader 需要文件路径）
        const tempFilePath = join(tmpdir(), `temp_${Date.now()}.pdf`);
        await writeFile(tempFilePath, file.buffer);
        
        console.log('Processing document:', file.originalname);
        console.log('Temp file created at:', tempFilePath);

        // 2. 使用 PDFLoader 加载文档
        const loader = new PDFLoader(tempFilePath, {
            splitPages: true
        });

        // 3. 加载文档
        const docs = await loader.load();
        console.log(`Loaded ${docs.length} pages`);

        // 4. 设置文本分割器
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        });

        // 5. 分割文档
        const chunks = await textSplitter.splitDocuments(docs);
        console.log(`Split into ${chunks.length} chunks`);

        // 验证每个文档块
        const validChunks = chunks.filter(chunk => {
            if (!chunk.pageContent || chunk.pageContent.trim() === '') {
                console.log('Found empty chunk, skipping...');
                return false;
            }
            return true;
        });

        console.log(`Original chunks: ${chunks.length}, Valid chunks: ${validChunks.length}`);

        // 6. 返回处理后的文档块
        return chunks.map(chunk => ({
            text: chunk.pageContent,
            metadata: {
                ...chunk.metadata,
                fileName: file.originalname,
                processedAt: new Date().toISOString()
            }
        }));

    } catch (error) {
        console.error('Document processing error:', error);
        throw new Error(`Failed to process document: ${error.message}`);
    }
}

export const splitIntoChunks = async (text) => {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        });

        const chunks = await splitter.createDocuments([text]);
        
        return chunks.map(chunk => chunk.pageContent);
    } catch (error) {
        console.error('Error splitting text into chunks:', error);
        throw new Error(`Failed to split text: ${error.message}`);
    }
};