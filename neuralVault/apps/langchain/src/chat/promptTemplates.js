export const CHAT_PROMPTS = {
  CONTEXTUAL_QA: `You are a helpful AI assistant. Use the following context to answer the user's question. If you cannot find the answer in the context, say so.

Context:
{context}

Question: {question}

Answer:`,

  GENERAL_QA: `You are a helpful AI assistant. Answer the following question based on your knowledge:

Question: {question}

Answer:`,

  DOCUMENT_ANALYSIS: `Analyze the following document content and provide insights:

Document Content:
{context}

Analysis Request: {question}

Analysis:`,

  SUMMARIZATION: `Please provide a concise summary of the following content:

Content:
{context}

Summary:`,

  COMPARISON: `Compare and contrast the following information:

Content 1:
{context1}

Content 2:
{context2}

Comparison Request: {question}

Comparison:`,

  CODE_ANALYSIS: `Analyze the following code and provide insights:

Code:
{context}

Analysis Request: {question}

Analysis:`,

  TECHNICAL_EXPLANATION: `Explain the following technical concept in simple terms:

Technical Content:
{context}

Question: {question}

Explanation:`,
};
