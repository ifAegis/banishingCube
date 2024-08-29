export default {
  async fetch(request, env) {
    const initialTitle = '! Title: Banishing Cube';
    if (request.method === 'POST') {
      const { url } = await request.json();

      if (!url || url.length !== 11) {
        return new Response('Invalid or missing URL', { status: 400 }); // Ensure URL is an 11-character string
      }

      const objectKey = 'urls.txt'; // Use a single file, with appended URLs

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
        const objectContent = existingContent.trim() ? `${existingContent}\n${url}` : url;

        // Save the updated content back to R2 bucket
        await env.R2_BUCKET.put(objectKey, objectContent); // When binding your R2 bucket to this Worker, the variable name must match "R2_BUCKET" or one of your own choosing.

        return new Response(JSON.stringify({ success: true, message: 'URL appended' }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://www.youtube.com', // Only allow Youtube to prevent rogues from messing with your URL list.
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
        });
      } catch (err) {
        console.error(`Error saving URL: ${err.message}`);
        return new Response(`Error saving URL: ${err.message}`, { status: 500 });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  },
};
