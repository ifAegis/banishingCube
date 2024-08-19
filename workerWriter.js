export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      const { url } = await request.json();

      if (!url) {
        return new Response('No URL provided', { status: 400 }); // Ideally, don't trigger this.
      }

      const objectKey = 'urls.txt'; // Use a single file, with appended URLs

      try {
        // Fetch existing content from R2 bucket
        let existingContent = await env.R2_BUCKET.get(objectKey);
        if (existingContent === null) {
          existingContent = ''; // Initialize if file does not exist
        } else {
          // Convert response to text
          existingContent = await existingContent.text();
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
