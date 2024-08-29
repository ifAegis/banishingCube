export default {
  async fetch(request, env) {
    const objectKey = 'urls.txt'; // Use a single file to append URLs

    if (request.method === 'GET') {
      try {
        // Fetch existing content from R2 bucket
        let existingContent = await env.R2_BUCKET.get(objectKey);
        if (existingContent === null) {
          return new Response('No URLs found', { status: 404 });
        }

        // Convert response to text
        let content = await existingContent.text();

        // Process each line to the desired format
        const formattedContent = content.split('\n').map(line => {
          // Ensure line is treated as a string and trimmed
          line = line.trim(); 
          
          // Format each line as needed, except for title lines
          if (line && !line.startsWith('! Title')) {
            return `www.youtube.com##ytd-rich-item-renderer:has(a[href*="${line}"])`;
          }
          // Return lines that do not need formatting (e.g., title lines)
          return line;
        }).join('\n');

        return new Response(formattedContent, {
          headers: { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': 'https://www.youtube.com',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
        });
      } catch (err) {
        console.error(`Error retrieving URLs: ${err.message}`);
        return new Response(`Error retrieving URLs: ${err.message}`, { status: 500 });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  },
};
