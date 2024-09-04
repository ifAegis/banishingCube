export default {
    async fetch(request, env) {
      // Function to get the next exact hour
      function getNextExactHour() {
        const now = new Date();
        const nextHour = new Date(now.getTime() + (60 - now.getMinutes()) * 60000);
        return `! Expires: ${Math.round((nextHour.getTime() - now.getTime()) / 60000)} minutes`;
      }
  
      const initialTitle = `! Title: Banishing Cube\n${getNextExactHour()}\nwww.youtube.com##ytd-rich-grid-row,#contents.ytd-rich-grid-row:style(display: contents !important)`;
      const objectKey = 'urls.txt'; // Use a single file to append URLs
  
      // Handle POST requests
      if (request.method === 'POST') {
        const { url } = await request.json();
  
        if (!url || url.length !== 11) {
          return new Response('Invalid or missing URL', { status: 400 }); // Ensure URL is an 11-character string
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
            if (!existingContent.startsWith('! Title: Banishing Cube')) {
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
  
      // Handle GET requests
      if (request.method === 'GET') {
        try {
          // Fetch existing content from R2 bucket
          let existingContent = await env.R2_BUCKET.get(objectKey);
          if (existingContent === null) {
            return new Response('No URLs found', { status: 404 });
          }
  
          // Convert response to text
          let content = await existingContent.text();
  
          // Update the Expires line with the next exact hour
          const expiresLine = getNextExactHour();
          const updatedContent = content.split('\n').map(line => {
            if (line.startsWith('! Expires')) {
              return expiresLine; // Update the Expires line
            }
            return line;
          }).join('\n');
  
          // Process each line to the desired format
          const formattedContent = updatedContent.split('\n').map(line => {
            // Ensure line is treated as a string and trimmed
            line = line.trim(); 
            
            // Format each line as needed, except for title lines
            if (line && !line.startsWith('! Title') && !line.startsWith('! Expires') && !line.startsWith('www.youtube.com##ytd-rich-grid')) {
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
  