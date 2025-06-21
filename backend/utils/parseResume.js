const axios = require('axios');

async function parseResume(docUrl) {
  try {
    const endpoint = `https://api.apilayer.com/resume_parser/url?url=${encodeURIComponent(docUrl)}`; // Removed semicolon
    const response = await axios.get(endpoint, {
      headers: {
        apikey: 'ES4RiFmezFQ30w6fFhaRNxY9GmPx9hLb'
      },
      timeout: 30000 // 30 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(`Resume parsing failed: ${error.message}`);
  }
}

module.exports = parseResume;