// import pdf from 'pdf-parse';
// import mammoth from 'mammoth';
import { marked } from 'marked';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

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