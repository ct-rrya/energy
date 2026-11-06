const fs = require('fs');
const html = fs.readFileSync('C:/Users/Merry Apple Edano/.gemini/antigravity/brain/901e4f2d-ec1d-450e-a808-c8304fe1927d/.user_uploaded/media_1793964084828_de393cfe.html', 'utf8');
const match = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (match) {
  const json = JSON.parse(match[1].trim());
  fs.writeFileSync('C:/Users/Merry Apple Edano/.gemini/antigravity/brain/901e4f2d-ec1d-450e-a808-c8304fe1927d/scratch/template_extracted.html', json);
  console.log('Success, length:', json.length);
} else {
  console.log('No match');
}

