let tree1, tree2, tree3, tree4, tree5, tree6, tree7, tree8, tree9;
let noiseImg;
let revealedPixels = [];
let pixelSize = 50;
let startX, startY;
let isDragging = false;
let transitionDuration = 5000; // 5 seconds transition from noise
let flickerDuration = 7; // 7 seconds of flickering
let flickerInterval = 400; // 0.007 seconds between flickers
let fadeStartTime = 10000; // Start fading after 15 seconds
let fadeOutDuration = 1000; // 3 seconds fade out duration

function preload() {
  tree1 = loadImage('tree1.jpeg');
  tree2 = loadImage('tree2.jpeg');
  tree3 = loadImage('tree3.jpeg');
  tree4 = loadImage('tree4.jpeg');
  tree5 = loadImage('tree5.jpeg');
  tree6 = loadImage('tree6.jpeg');
  tree7 = loadImage('tree7.jpeg');
  tree8 = loadImage('tree8.jpeg');
  tree9 = loadImage('tree9.jpeg');
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
  
  // Draw tree2, 3, 4, 5, 6, 7, 8, 9 at full opacity
  tint(255, 255);
  image(tree2, 0, 0, width, height);
  image(tree3, 0, 0, width, height);
  image(tree4, 0, 0, width, height);
  image(tree5, 0, 0, width, height);
  image(tree6, 0, 0, width, height);
  image(tree7, 0, 0, width, height);
  image(tree8, 0, 0, width, height);
  image(tree9, 0, 0, width, height);
  
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
      let tree1Probability = 1.0 / 9.0; // Default equal distribution (11.1%)
      
      if (elapsed > fadeStartTime - 4000 && elapsed < fadeStartTime) {
        // Gradually increase tree1 probability from 11.1% to 100% in last 4 seconds before fadeout
        let progressToFade = (elapsed - (fadeStartTime - 4000)) / 4000;
        tree1Probability = (1.0 / 9.0) + progressToFade * (1.0 - 1.0 / 9.0);
      } else if (elapsed >= fadeStartTime) {
        // Keep at 100% during fadeout
        tree1Probability = 1.0;
      }
      
      // Select from trees 1-9 with weighted probability
      let treeRand = random();
      if (treeRand < tree1Probability) {
        currentChoice = 1; // tree1
      } else {
        // Distribute remaining probability equally among trees 2-9
        let remainingProb = 1.0 - tree1Probability;
        let eachOtherProb = remainingProb / 8.0;
        let adjustedRand = (treeRand - tree1Probability) / remainingProb;
        currentChoice = floor(adjustedRand * 8) + 2; // trees 2-9
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
    else if (currentChoice === 6) selectedImage = tree6;
    else if (currentChoice === 7) selectedImage = tree7;
    else if (currentChoice === 8) selectedImage = tree8;
    else selectedImage = tree9;
    
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
    // Use touch position if available, otherwise use mouse position
    let currentX = touches.length > 0 ? touches[0].x : mouseX;
    let currentY = touches.length > 0 ? touches[0].y : mouseY;
    rect(startX, startY, currentX - startX, currentY - startY);
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
  handleRelease(mouseX, mouseY);
}

function touchEnded() {
  // Use the last known touch position or current mouse position
  let endX = touches.length > 0 ? touches[0].x : mouseX;
  let endY = touches.length > 0 ? touches[0].y : mouseY;
  handleRelease(endX, endY);
  // Prevent default behavior to avoid triggering mouse events
  return false;
}

function handleRelease(endX, endY) {
  if (isDragging) {
    // Add all pixels within the rectangle
    let x1 = min(startX, endX);
    let y1 = min(startY, endY);
    let x2 = max(startX, endX);
    let y2 = max(startY, endY);
    
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
              treeChoice = floor(random(1, 10)); // Random integer from 1 to 9
            } else {
              // Favor tree1 (60% tree1, 5% each for others)
              let rand = random();
              if (rand < 0.6) treeChoice = 1;
              else if (rand < 0.65) treeChoice = 2;
              else if (rand < 0.70) treeChoice = 3;
              else if (rand < 0.75) treeChoice = 4;
              else if (rand < 0.80) treeChoice = 5;
              else if (rand < 0.85) treeChoice = 6;
              else if (rand < 0.90) treeChoice = 7;
              else if (rand < 0.95) treeChoice = 8;
              else treeChoice = 9;
            }
            
            revealedPixels[existingIndex].treeChoice = treeChoice;
            revealedPixels[existingIndex].revealTime = millis(); // Reset transition
          } else {
            // New pixel: start with equal random distribution (pass 1)
            let treeChoice = floor(random(1, 10)); // Random integer from 1 to 9
            let randomSeedValue = floor(random(1000000)); // Unique random seed for this pixel
            revealedPixels.push({ x: px, y: py, treeChoice: treeChoice, passCount: 1, revealTime: millis(), randomSeed: randomSeedValue });
          }
        }
      }
    }
    
    isDragging = false;
  }
}

function touchStarted() {
  if (touches.length > 0) {
    startX = touches[0].x;
    startY = touches[0].y;
    isDragging = true;
  }
  // Prevent default behavior to avoid scrolling
  return false;
}
