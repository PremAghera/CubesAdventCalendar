exports.handler = async (event, context) => {
  const { default: fetch } = await import('node-fetch');
  const { default: FormData } = await import('form-data');

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Method Not Allowed'
    };
  }
  
  console.log("Upload function invoked:", event.httpMethod);
  
  // Parse the request body as JSON
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    console.error("Invalid JSON in request body:", err);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid JSON in request body'
    };
  }
  
  // Check if imageData is provided and is a valid Data URL
  if (!data.imageData || typeof data.imageData !== 'string') {
    console.error("Missing or invalid imageData");
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Missing imageData'
    };
  }
  
  // Validate that the imageData is in a Data URL format (e.g., "data:image/png;base64,...")
  if (!data.imageData.startsWith('data:image/')) {
    console.error("imageData is not in a valid Data URL format");
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Invalid image data format'
    };
  }
  
  // Optional: Check for a reasonable file size by examining the length of the Data URL
  const MAX_SIZE = 5 * 1024 * 1024; // Rough threshold for a 5MB file (this is an approximate check)
  if (data.imageData.length > MAX_SIZE) {
    console.error("Image data exceeds size limit");
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Image is too large'
    };
  }
  
  // Prepare the form data for the Cloudinary upload
  const form = new FormData();
  form.append('file', data.imageData);
  form.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
  
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  try {
    // Upload the image to Cloudinary
    const response = await fetch(cloudinaryUrl, { method: 'POST', body: form });
    const result = await response.json();
    
    console.log("Cloudinary response:", result);
    
    if (!response.ok || !result.secure_url) {
      console.error("Upload failed on Cloudinary:", result);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Image upload failed'
      };
    }
    
    // Return the secure URL from Cloudinary
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: result.secure_url })
    };
    
  } catch (error) {
    console.error("Error during image upload:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Server error during image upload'
    };
  }
};