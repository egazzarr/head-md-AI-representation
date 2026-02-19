let tree1, tree2, tree3, tree4, tree5, tree6;
let noiseImg;
let revealedPixels = [];
let pixelSize = 50;
let startX, startY;
let isDragging = false;
let transitionDuration = 5000; // 5 seconds transition from noise
let flickerDuration = 7; // 7 seconds of flickering
let flickerInterval = 200; // 0.007 seconds between flickers
let fadeStartTime = 10000; // Start fading after 15 seconds
let fadeOutDuration = 1000; // 3 seconds fade out duration

function preload() {
  tree1 = loadImage('tree6.jpg');
  tree2 = loadImage('tree2.jpg');
  tree3 = loadImage('tree3.jpg');
  tree4 = loadImage('tree4.jpg');
  tree5 = loadImage('tree5.jpg');
  tree6 = loadImage('tree1.png');
  noiseImg = loadImage('noise.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
}
 
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  revealedPixels = [];
}

function draw() {
  background(255);
  
  // Draw tree2, 3, 4, 5, 6 at full opacity
  tint(255, 255);
  image(tree2, 0, 0, width, height);
  image(tree3, 0, 0, width, height);
  image(tree4, 0, 0, width, height);
  image(tree5, 0, 0, width, height);
  image(tree6, 0, 0, width, height);
  
  // Draw tree1 on top at full opacity
  tint(255, 255);
  image(tree1, 0, 0, width, height);
  
  // Draw pixelated reveal areas
  noStroke();
  for (let i = revealedPixels.length - 1; i >= 0; i--) {
    let pixel = revealedPixels[i];
    let x = pixel.x * pixelSize;
    let y = pixel.y * pixelSize;
    
    // Calculate time elapsed since reveal
    let elapsed = millis() - pixel.revealTime;
    
    // Determine which image to show - flickering including noise (0) and trees (1-6)
    let flickerIndex = floor(elapsed / flickerInterval);
    
    // Calculate noise probability based on elapsed time
    let noiseProbability = 1.0; // 100% by default
    if (elapsed < 1000) {
      noiseProbability = 1.0; // 100% in first second
    } else if (elapsed < 6000) {
      // Gradually reduce from 100% to 0% between 1-6 seconds
      noiseProbability = 1.0 - (elapsed - 1000) / 5000;
    } else {
      noiseProbability = 0.0; // 0% after 6 seconds
    }
    
    // Generate stable random choice for this flicker step using pixel's unique seed
    randomSeed(pixel.randomSeed + flickerIndex);
    let rand = random();
    let currentChoice;
    
    if (rand < noiseProbability) {
      currentChoice = 0; // Noise
    } else {
      // Calculate tree1 probability - increases in last 4 seconds before fade out, stays 100% during fadeout
      let tree1Probability = 1.0 / 6.0; // Default equal distribution (16.7%)
      
      if (elapsed > fadeStartTime - 4000 && elapsed < fadeStartTime) {
        // Gradually increase tree1 probability from 16.7% to 100% in last 4 seconds before fadeout
        let progressToFade = (elapsed - (fadeStartTime - 4000)) / 4000;
        tree1Probability = (1.0 / 6.0) + progressToFade * (1.0 - 1.0 / 6.0);
      } else if (elapsed >= fadeStartTime) {
        // Keep at 100% during fadeout
        tree1Probability = 1.0;
      }
      
      // Select from trees 1-6 with weighted probability
      let treeRand = random();
      if (treeRand < tree1Probability) {
        currentChoice = 1; // tree1
      } else {
        // Distribute remaining probability equally among trees 2-6
        let remainingProb = 1.0 - tree1Probability;
        let eachOtherProb = remainingProb / 5.0;
        let adjustedRand = (treeRand - tree1Probability) / remainingProb;
        currentChoice = floor(adjustedRand * 5) + 2; // trees 2-6
      }
    }
    randomSeed(); // Reset random seed
    
    // Select the image for this pixel
    let selectedImage;
    if (currentChoice === 0) selectedImage = noiseImg;
    else if (currentChoice === 1) selectedImage = tree1;
    else if (currentChoice === 2) selectedImage = tree2;
    else if (currentChoice === 3) selectedImage = tree3;
    else if (currentChoice === 4) selectedImage = tree4;
    else if (currentChoice === 5) selectedImage = tree5;
    else selectedImage = tree6;
    
    let sx = x * selectedImage.width / width;
    let sy = y * selectedImage.height / height;
    let sw = pixelSize * selectedImage.width / width;
    let sh = pixelSize * selectedImage.height / height;
    
    // If showing noise during first 6 seconds, add random pixel shifts
    if (currentChoice === 0 && elapsed < 6000) {
      randomSeed(pixel.randomSeed + flickerIndex + 999);
      let shiftX = floor(random(width / pixelSize)) * pixelSize;
      let shiftY = floor(random(height / pixelSize)) * pixelSize;
      sx = shiftX * selectedImage.width / width;
      sy = shiftY * selectedImage.height / height;
      randomSeed(); // Reset random seed
    }
    
    // Calculate fade out after fadeStartTime
    let fadeOutProgress = 0;
    if (elapsed > fadeStartTime) {
      fadeOutProgress = constrain((elapsed - fadeStartTime) / fadeOutDuration, 0, 1);
      
      // Remove pixel if fully faded out
      if (fadeOutProgress >= 1) {
        revealedPixels.splice(i, 1);
        continue;
      }
    }
    
    // Draw the selected image with fade out applied
    let finalOpacity = 255 * (1 - fadeOutProgress);
    tint(255, finalOpacity);
    image(selectedImage, x, y, pixelSize, pixelSize, sx, sy, sw, sh);
  }
  
  // Draw preview rectangle while dragging
  if (isDragging) {
    noFill();
    stroke('rgb(255, 101, 214)');
    strokeWeight(5);
    rect(startX, startY, mouseX - startX, mouseY - startY);
  }
}

function sampleOverlappedColor(x, y) {
  // Randomly select either tree2 or tree3
  let selectedTree = random() > 0.5 ? tree2 : tree3;
  let col = selectedTree.get(x * selectedTree.width / width, y * selectedTree.height / height);
  
  return col;
}


function mousePressed() {
  startX = mouseX;
  startY = mouseY;
  isDragging = true;
}

function mouseReleased() {
  if (isDragging) {
    // Add all pixels within the rectangle
    let x1 = min(startX, mouseX);
    let y1 = min(startY, mouseY);
    let x2 = max(startX, mouseX);
    let y2 = max(startY, mouseY);
    
    for (let x = x1; x < x2; x += pixelSize) {
      for (let y = y1; y < y2; y += pixelSize) {
        let px = floor(x / pixelSize);
        let py = floor(y / pixelSize);
        
        if (px >= 0 && py >= 0 && px < width / pixelSize && py < height / pixelSize) {
          // Check if this pixel is already revealed
          let existingIndex = revealedPixels.findIndex(p => p.x === px && p.y === py);
          
          if (existingIndex !== -1) {
            // Pixel exists, increment pass count and recalculate
            revealedPixels[existingIndex].passCount++;
            let passCount = revealedPixels[existingIndex].passCount;
            
            // Odd passes (1, 3, 5...): equal random distribution
            // Even passes (2, 4, 6...): favor tree1
            let treeChoice;
            if (passCount % 2 === 1) {
              // Equal distribution for all trees
              treeChoice = floor(random(1, 7)); // Random integer from 1 to 6
            } else {
              // Favor tree1 (60% tree1, 8% each for others)
              let rand = random();
              if (rand < 0.6) treeChoice = 1;
              else if (rand < 0.68) treeChoice = 2;
              else if (rand < 0.76) treeChoice = 3;
              else if (rand < 0.84) treeChoice = 4;
              else if (rand < 0.92) treeChoice = 5;
              else treeChoice = 6;
            }
            
            revealedPixels[existingIndex].treeChoice = treeChoice;
            revealedPixels[existingIndex].revealTime = millis(); // Reset transition
          } else {
            // New pixel: start with equal random distribution (pass 1)
            let treeChoice = floor(random(1, 7)); // Random integer from 1 to 6
            let randomSeedValue = floor(random(1000000)); // Unique random seed for this pixel
            revealedPixels.push({ x: px, y: py, treeChoice: treeChoice, passCount: 1, revealTime: millis(), randomSeed: randomSeedValue });
          }
        }
      }
    }
    
    isDragging = false;
  }
}
