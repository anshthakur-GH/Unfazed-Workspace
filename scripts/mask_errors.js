const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');

const maskErrorsInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace { error: err.message } with { error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message }
    const regex1 = /\{ error: err\.message \}/g;
    const replacement1 = "{ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message }";
    
    // Replace { message: err.message } with { message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message }
    const regex2 = /\{ message: err\.message \}/g;
    const replacement2 = "{ message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message }";
    
    let modified = false;
    if (regex1.test(content)) {
        content = content.replace(regex1, replacement1);
        modified = true;
    }
    if (regex2.test(content)) {
        content = content.replace(regex2, replacement2);
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${path.basename(filePath)}`);
    }
};

const processDirectory = (directory) => {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js')) {
            maskErrorsInFile(fullPath);
        }
    });
};

processDirectory(routesDir);
console.log('Error masking complete.');
