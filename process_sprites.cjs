const fs = require('fs');
const PNG = require('pngjs').PNG;

function processImage(inputFile, outputFile, removeBg) {
    fs.createReadStream(inputFile)
        .pipe(new PNG({ filterType: 4 }))
        .on('parsed', function() {
            if (removeBg) {
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        let idx = (this.width * y + x) << 2;
                        
                        let r = this.data[idx];
                        let g = this.data[idx+1];
                        let b = this.data[idx+2];
                        
                        // Magenta is (255, 0, 255)
                        let dist = Math.sqrt(Math.pow(r - 255, 2) + Math.pow(g - 0, 2) + Math.pow(b - 255, 2));
                        
                        if (dist < 100) {
                            // Turn pixel fully transparent
                            this.data[idx+3] = 0; 
                        }
                    }
                }
            }
            this.pack().pipe(fs.createWriteStream(outputFile));
            console.log('Saved', outputFile);
        });
}

const fsPromises = require('fs').promises;
(async () => {
    await fsPromises.mkdir('public/sprites', { recursive: true });
    
    // Process Sunny
    processImage(
        '/home/cazzi/.gemini/antigravity/brain/10c69652-e8c1-47c6-8595-08bc4822fdef/sunny_sprite_1772916672594.png', 
        'public/sprites/sunny.png', 
        true
    );
    
    // Process Marine
    processImage(
        '/home/cazzi/.gemini/antigravity/brain/10c69652-e8c1-47c6-8595-08bc4822fdef/marine_sprite_1772916688954.png', 
        'public/sprites/marine.png', 
        true
    );
    
    // Process Ocean
    processImage(
        '/home/cazzi/.gemini/antigravity/brain/10c69652-e8c1-47c6-8595-08bc4822fdef/ocean_bg_1772916701922.png', 
        'public/sprites/ocean.png', 
        false
    );
})();
