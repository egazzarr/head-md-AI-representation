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
let imgWidth, imgHeight, imgX, imgY; // Image dimensions and position
let mainTreeOptions = [1, 8, 9, 6]; // Cycle through these trees
let mainTreeIndex; // Selected main tree index
let mainTree; // The actual main tree image

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
  
  // Select one of the main trees cyclically based on current time
  let cycleIndex = floor((millis() / 100) % mainTreeOptions.length);
  mainTreeIndex = mainTreeOptions[cycleIndex];
  
  // Assign the actual tree image
  if (mainTreeIndex === 1) mainTree = tree1;
  else if (mainTreeIndex === 6) mainTree = tree6;
  else if (mainTreeIndex === 8) mainTree = tree8;
  else if (mainTreeIndex === 9) mainTree = tree9;
  
  calculateImageDimensions();
}

function calculateImageDimensions() {
  // Calculate dimensions to fit height while maintaining aspect ratio
  // Make image 85% of screen height to leave space for pink background top and bottom
  imgHeight = height * 0.85;
  imgWidth = mainTree.width * (imgHeight / mainTree.height);
  imgX = (width - imgWidth) / 2;
  imgY = (height - imgHeight) / 2;
}
 
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  revealedPixels = [];
  calculateImageDimensions();
}

function draw() {
  // Pink background
  background('rgb(255, 101, 214)');
  
  // Draw tree2, 3, 4, 5, 6, 7, 8, 9 at full opacity
  tint(255, 255);
  image(tree2, imgX, imgY, imgWidth, imgHeight);
  image(tree3, imgX, imgY, imgWidth, imgHeight);
  image(tree4, imgX, imgY, imgWidth, imgHeight);
  image(tree5, imgX, imgY, imgWidth, imgHeight);
  image(tree6, imgX, imgY, imgWidth, imgHeight);
  image(tree7, imgX, imgY, imgWidth, imgHeight);
  image(tree8, imgX, imgY, imgWidth, imgHeight);
  image(tree9, imgX, imgY, imgWidth, imgHeight);
  
  // Draw the selected main tree on top at full opacity
  tint(255, 255);
  image(mainTree, imgX, imgY, imgWidth, imgHeight);
  
  // Draw pixelated reveal areas
  noStroke();
  for (let i = revealedPixels.length - 1; i >= 0; i--) {
    let pixel = revealedPixels[i];
    let x = imgX + pixel.x * pixelSize;
    let y = imgY + pixel.y * pixelSize;
    
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
      // Calculate main tree probability - increases in last 4 seconds before fade out, stays 100% during fadeout
      let mainTreeProbability = 1.0 / 9.0; // Default equal distribution (11.1%)
      
      if (elapsed > fadeStartTime - 4000 && elapsed < fadeStartTime) {
        // Gradually increase main tree probability from 11.1% to 100% in last 4 seconds before fadeout
        let progressToFade = (elapsed - (fadeStartTime - 4000)) / 4000;
        mainTreeProbability = (1.0 / 9.0) + progressToFade * (1.0 - 1.0 / 9.0);
      } else if (elapsed >= fadeStartTime) {
        // Keep at 100% during fadeout
        mainTreeProbability = 1.0;
      }
      
      // Select from trees 1-9 with weighted probability
      let treeRand = random();
      if (treeRand < mainTreeProbability) {
        currentChoice = mainTreeIndex; // Use the selected main tree
      } else {
        // Distribute remaining probability equally among trees 2-9
        let remainingProb = 1.0 - mainTreeProbability;
        let eachOtherProb = remainingProb / 8.0;
        let adjustedRand = (treeRand - mainTreeProbability) / remainingProb;
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
    
    let sx = (x - imgX) * selectedImage.width / imgWidth;
    let sy = (y - imgY) * selectedImage.height / imgHeight;
    let sw = pixelSize * selectedImage.width / imgWidth;
    let sh = pixelSize * selectedImage.height / imgHeight;
    
    // If showing noise during first 6 seconds, add random pixel shifts
    if (currentChoice === 0 && elapsed < 6000) {
      randomSeed(pixel.randomSeed + flickerIndex + 999);
      let shiftX = floor(random(imgWidth / pixelSize)) * pixelSize;
      let shiftY = floor(random(imgHeight / pixelSize)) * pixelSize;
      sx = shiftX * selectedImage.width / imgWidth;
      sy = shiftY * selectedImage.height / imgHeight;
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
  
  // Draw title
  noTint();
  textAlign(CENTER, TOP);
  textFont('Courier New');
  textSize(15);
  fill('rgb(0, 0, 0)');
  
  
  text('Drag 1 finger/mouse on the area to inspect', width / 2, 20);
  noStroke();
  
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
  let col = selectedTree.get((x - imgX) * selectedTree.width / imgWidth, (y - imgY) * selectedTree.height / imgHeight);
  
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
        // Convert screen coordinates to image coordinates
        let px = floor((x - imgX) / pixelSize);
        let py = floor((y - imgY) / pixelSize);
        
        if (px >= 0 && py >= 0 && px < imgWidth / pixelSize && py < imgHeight / pixelSize) {
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
