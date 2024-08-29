export default {
  async fetch(request, env) {
    const objectKey = 'urls.txt'; // Use a single file to append URLs
    const initialTitle = '! Title: Banishing Cube';

    if (request.method === 'POST') {
      let { url } = await request.json();

      if (!url) {
        return new Response('No URL provided', { status: 400 });
      }

      if (!url.includes('/watch')) {
        return new Response('URL is not a video', { status: 400 });
      }

      try {
        // Fetch existing content from R2 bucket
        let existingContent = await env.R2_BUCKET.get(objectKey);
        if (existingContent === null) {
          // Initialize if file does not exist
          existingContent = initialTitle;
        } else {
          // Convert response to text
          existingContent = await existingContent.text();

          // Ensure the title is at the top
          if (!existingContent.startsWith(initialTitle)) {
            existingContent = `${initialTitle}\n${existingContent.trim()}`;
          }

          // Check if the URL already exists in the content
          if (existingContent.includes(url)) {
            return new Response(JSON.stringify({ success: false, message: 'URL already exists', bounce: true }), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://www.youtube.com',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              },
            });
          }
        }

        // Append the new URL directly to the existing content
        const objectContent = `${existingContent}\n${url}`;

        // Save the updated content back to R2 bucket
        await env.R2_BUCKET.put(objectKey, objectContent);

        return new Response(JSON.stringify({ success: true, message: 'URL appended' }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://www.youtube.com',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
        });
      } catch (err) {
        console.error(`Error saving URL: ${err.message}`);
        return new Response(`Error saving URL: ${err.message}`, { status: 500 });
      }
    }

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
