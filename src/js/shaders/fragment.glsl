// ============================================================================
// FRAGMENT SHADER: Pixel Displacement Transition Effect
// ============================================================================
// This shader creates a smooth transition between two images using a displacement
// texture to create organic, morphing effects. It also converts images to
// grayscale and enhances contrast for a dramatic visual style.
// ============================================================================

// Input: UV coordinates passed from vertex shader (0.0 to 1.0 for both x and y)
varying vec2 vUv;

// ============================================================================
// UNIFORMS (values passed from JavaScript)
// ============================================================================

// The two images to transition between
uniform sampler2D texture1;    // Current/starting image
uniform sampler2D texture2;    // Target/ending image

// Displacement texture (grayscale image that controls distortion)
// Bright areas create more displacement, dark areas create less
uniform sampler2D disp;

// Controls the transition progress (0.0 = start, 1.0 = complete)
uniform float dispPower;

// Controls the strength/intensity of the displacement effect
uniform float intensity;

// Image dimensions (width, height) - currently unused but available
uniform vec2 size;

// Screen resolution (width, height) - currently unused but available
uniform vec2 res;

// ============================================================================
// MAIN SHADER FUNCTION
// ============================================================================
void main() {
  // Get the current pixel's UV coordinates
  vec2 uv = vUv;
  
  // ============================================================================
  // DISPLACEMENT CALCULATION
  // ============================================================================
  
  // Sample the displacement texture at current UV position
  // disp.rgb contains displacement values (typically grayscale)
  vec4 disp = texture2D(disp, uv);
  
  // Extract displacement vector from the red and green channels
  // This creates a 2D offset direction for each pixel
  vec2 dispVec = vec2(disp.x, disp.y);
  
  // Calculate distorted UV positions for both textures
  // distPos1: texture1 gets displaced in the direction of dispVec
  // distPos2: texture2 gets displaced in the opposite direction
  // This creates a "pulling apart" effect during transition
  vec2 distPos1 = uv + (dispVec * intensity * dispPower);
  vec2 distPos2 = uv + (dispVec * -(intensity * (1.0 - dispPower)));
  
  // ============================================================================
  // TEXTURE SAMPLING
  // ============================================================================
  
  // Sample both textures at their distorted positions
  // This creates the warped/morphed appearance
  vec4 texture1 = texture2D(texture1, distPos1);
  vec4 texture2 = texture2D(texture2, distPos2);

  // ============================================================================
  // GRAYSCALE CONVERSION
  // ============================================================================
  
  // Convert both textures to grayscale using luminance weights
  // These weights (0.299, 0.587, 0.114) approximate human eye sensitivity:
  // - Red: 29.9% of perceived brightness
  // - Green: 58.7% of perceived brightness  
  // - Blue: 11.4% of perceived brightness
  float gray1 = dot(texture1.rgb, vec3(0.299, 0.587, 0.114));
  float gray2 = dot(texture2.rgb, vec3(0.299, 0.587, 0.114));
  
  // Create new grayscale textures, preserving original alpha values
  texture1 = vec4(vec3(gray1), texture1.a);
  texture2 = vec4(vec3(gray2), texture2.a);

  // ============================================================================
  // CONTRAST ENHANCEMENT
  // ============================================================================
  
  // Increase contrast for more dramatic visual impact
  float contrast = 1.5;    // 1.0 = no change, >1.0 = more contrast
  float midpoint = 0.15;   // Pivot point for contrast adjustment
  
  // Apply contrast transformation to both textures
  // Formula: (color - midpoint) * contrast + midpoint
  // This pushes dark pixels darker and light pixels lighter
  texture1.rgb = (texture1.rgb - midpoint) * contrast + midpoint;
  texture2.rgb = (texture2.rgb - midpoint) * contrast + midpoint;
  
  // ============================================================================
  // FINAL OUTPUT
  // ============================================================================
  
  // Blend between the two processed textures based on transition progress
  // dispPower = 0.0: Shows 100% texture1
  // dispPower = 0.5: Shows 50% of each texture
  // dispPower = 1.0: Shows 100% texture2
  gl_FragColor = mix(texture1, texture2, dispPower);
}