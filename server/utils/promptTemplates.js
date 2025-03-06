export const ANSWER_TEMPLATE = `
You are a knowledgeable assistant with access to company documents. 
Based on the provided context, please answer the question accurately and professionally.
Only use information from the given context. If you're unsure, please say so.

Context:
{context}

Question: {question}

Please provide:
1. A clear and concise answer
2. References to relevant documents (if available)
3. Any necessary clarifications or caveats

Answer:`;

export const SUMMARY_TEMPLATE = `
Please provide a concise summary of the following document:

{content}

Summary should include:
1. Main topics covered
2. Key points
3. Important details

Summary:`;