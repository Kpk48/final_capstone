// Use direct API call for embeddings to match the working format
export async function embedText(chunks: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY as string;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  
  const model = "text-embedding-004";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;

  const vectors: number[][] = [];
  
  for (const text of chunks) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        content: {
          parts: [{
            text: text
          }]
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Embedding API error: ${response.status} - ${errorData}`);
    }
    
    const result = await response.json();
    const values: number[] = result.embedding?.values ?? [];
    vectors.push(values);
  }
  
  return vectors;
}
