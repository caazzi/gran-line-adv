import sys
import math
from PIL import Image

def process_sprite(input_path, output_path, target_size=None, remove_bg=False):
    try:
        img = Image.open(input_path).convert("RGBA")
        
        if remove_bg:
            datas = img.getdata()
            newData = []
            for item in datas:
                r, g, b, a = item
                # Magenta is (255, 0, 255)
                # Calculate distance
                dist = math.sqrt((r - 255)**2 + (g - 0)**2 + (b - 255)**2)
                
                # If very close to magenta, make fully transparent
                if dist < 80:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            img.putdata(newData)
            
        if target_size:
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            
        img.save(output_path, "PNG")
        print(f"Saved {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    import os
    os.makedirs("public/sprites", exist_ok=True)
    
    # Process Sunny
    process_sprite(
        "/home/cazzi/.gemini/antigravity/brain/10c69652-e8c1-47c6-8595-08bc4822fdef/sunny_sprite_1772916672594.png", 
        "public/sprites/sunny.png", 
        target_size=(160, 160), 
        remove_bg=True
    )
    
    # Process Marine
    process_sprite(
        "/home/cazzi/.gemini/antigravity/brain/10c69652-e8c1-47c6-8595-08bc4822fdef/marine_sprite_1772916688954.png", 
        "public/sprites/marine.png", 
        target_size=(160, 160), 
        remove_bg=True
    )
    
    # Process Ocean 
    process_sprite(
        "/home/cazzi/.gemini/antigravity/brain/10c69652-e8c1-47c6-8595-08bc4822fdef/ocean_bg_1772916701922.png", 
        "public/sprites/ocean.png",
        target_size=(800, 600),
        remove_bg=False
    )
