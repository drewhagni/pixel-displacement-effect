varying vec2 vUv;

uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;
uniform sampler2D dispMap;

uniform float progress;
uniform float intensity;

void main() {
  vec2 uv = vUv;

  vec4 dispMap = texture2D(dispMap, uv);
  vec2 dispVec = vec2(dispMap.x, dispMap.y);

  vec2 distPos1 = uv + (dispVec * intensity * progress);
  vec2 distPos2 = uv + (dispVec * -(intensity * (1.0 - progress)));

  vec4 texture1 = texture2D(texture1, distPos1);
  vec4 texture2 = texture2D(texture2, distPos2);

  vec4 finalColor = mix(texture1, texture2, progress);

  gl_FragColor = finalColor;
}