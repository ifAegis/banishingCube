export default {
  async fetch(request, env) {
    // Handle GET requests
    if (request.method === 'GET') {
      const objectKey = 'urls.txt'; // File name in R2 bucket, if you changed the save file from "urls.txt", change it here too

      try {
        // Fetch the content of the file from R2 bucket
        const object = await env.R2_BUCKET.get(objectKey); // Bind the same R2 bucket as the other worker. Don't forget to fix the variable name if you changed it!
        
        if (!object) {
          return new Response('File not found', { status: 404 }); // You'll get this error if you've not added any URLs to the bucket yet.
        }

        // Read the file content
        const text = await object.text();
        
        // Return the file content as plain text
        return new Response(text, {
          headers: { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*', // Allow all origins, I'm not sure it matters but I will change this if I am made aware it's insecure.
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
        });
      } catch (err) {
        console.error(`Error fetching file: ${err.message}`);
        return new Response(`Error fetching file: ${err.message}`, { status: 500 });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  },
};
