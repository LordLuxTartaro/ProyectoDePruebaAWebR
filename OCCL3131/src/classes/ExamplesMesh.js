import { creatGeom } from '@/classes/Face3DUtils'

// Creates a face mesh.
export const genMesh = (modelGeometry, shaderUniforms) => {
    const geometry = creatGeom(modelGeometry)
    
    // MATERIALS
    
    // Select from the following PBR Materials:
    // 'cracked', 'gross-gray', 'gross-green', 'porcelain-koi'
    // 'porcelain-sakura', 'porcelain-waves', 'rock-ice'
    
    let src = 'rock-ice'
    const MAP_URL = require(`@/assets/PBR/${src}/BaseColor.png`)
    const METAL_URL = require(`@/assets/PBR/${src}/Metallic.png`)
    const NORMAL_URL = require(`@/assets/PBR/${src}/Normal.png`)
    const ROUGH_URL = require(`@/assets/PBR/${src}/Roughness.png`)
    const ALPHA_URL = require('@/assets/Alpha/soft.png')
      
    // PBR
    let texLoader = new THREE.TextureLoader() 
    const pbr = new THREE.MeshStandardMaterial({
      map: texLoader.load(MAP_URL),
      metalnessMap: texLoader.load(METAL_URL),
      normalMap: texLoader.load(NORMAL_URL),
      roughnessMap: texLoader.load(ROUGH_URL),
      alphaMap: texLoader.load(ALPHA_URL),
      transparent: true,  
      opacity: 1.0
    })
    
    // Tattoo
    // '8-tat.png', 'mesh-black.png', 'mesh-grad.png'
    const tattoo = new THREE.MeshBasicMaterial({
      map: texLoader.load(require('@/assets/Tattoos/mesh-black.png')),
      alphaMap: texLoader.load(ALPHA_URL),
      transparent: true,  
      opacity: 0.8
    })
    
    // CUSTOM: purple vortex
    const custom_vortex = new THREE.ShaderMaterial({
      uniforms: shaderUniforms,
          vertexShader: 
          `varying vec2 vUv;
  
              void main()
              {
                  vUv = uv;
                  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                  gl_Position = projectionMatrix * mvPosition;
              }
          `,
          fragmentShader: 
          ` uniform float time;
  
              varying vec2 vUv;
  
              void main(void) {
  
                  vec2 p = - 1.0 + 2.0 * vUv;
                  float a = time * 40.0;
                  float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;
  
                  e = 400.0 * ( p.x * 0.5 + 0.5 );
                  f = 400.0 * ( p.y * 0.5 + 0.5 );
                  i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;
                  d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;
                  r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
                  q = f / r;
                  e = ( r * cos( q ) ) - a / 2.0;
                  f = ( r * sin( q ) ) - a / 2.0;
                  d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
                  h = ( ( f + d ) + a / 2.0 ) * g;
                  i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );
                  h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
                  h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;
                  i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );
                  i = mod( i / 5.6, 256.0 ) / 64.0;
                  if ( i < 0.0 ) i += 4.0;
                  if ( i >= 2.0 ) i = 4.0 - i;
                  d = r / 350.0;
                  d += sin( d * d * 8.0 ) * 0.52;
                  f = ( sin( a * g ) + 1.0 ) / 2.0;
                  gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );
  
              }
        `
    })
    
    // CUSTOM: flat disco
    const custom_disco = new THREE.ShaderMaterial({
      uniforms: shaderUniforms,
          vertexShader: 
          `
          varying vec2 vUv;
  
          void main()
            {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: 
          ` 
          uniform float time;
  
          varying vec2 vUv;
  
          void main( void ) {
  
              vec2 position = - 1.0 + 2.0 * vUv;
  
              float red = abs( sin( position.x * position.y + time / 5.0 ) );
              float green = abs( sin( position.x * position.y + time / 4.0 ) );
              float blue = abs( sin( position.x * position.y + time / 3.0 ) );
              gl_FragColor = vec4( red, green, blue, 1.0 );
  
          }
        `
    })
    
    // CUSTOM: texture vortex
    const custom_texVortex = new THREE.ShaderMaterial({
      uniforms: shaderUniforms,
          vertexShader: 
          `
          varying vec2 vUv;
  
          void main()
          {
              vUv = uv;
              vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
              gl_Position = projectionMatrix * mvPosition;
          }
          `,
          fragmentShader: 
          ` 
          uniform float time;
          
          uniform sampler2D vorTex;
          
          varying vec2 vUv;
  
          void main( void ) {
  
              vec2 position = - 1.0 + 2.0 * vUv;
  
              float t = atan( position.y, position.x );
              float r = sqrt( dot( position, position ) );
  
              vec2 uv;
              uv.x = cos( t ) / r;
              uv.y = sin( t ) / r;
              uv /= 10.0;
              uv += time * 0.05;
  
              vec3 color = texture2D( vorTex, uv ).rgb;
  
              gl_FragColor = vec4( color * r * 1.5, 1.0 );
              
          }
        `
    })
    
    // CUSTOM: lava
    const custom_lava = new THREE.ShaderMaterial({
      uniforms: shaderUniforms,
          vertexShader: 
          `
          uniform vec2 uvScale;
          varying vec2 vUv;
  
          void main()
          {
  
              vUv = uvScale * uv;
              vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
              gl_Position = projectionMatrix * mvPosition;
  
          }
          `,
          fragmentShader: 
          ` 
          uniform float time;
  
          uniform float fogDensity;
          uniform vec3 fogColor;
  
          uniform sampler2D lava1;
          uniform sampler2D lava2;
  
          varying vec2 vUv;
  
          void main( void ) {
  
              vec2 position = - 1.0 + 2.0 * vUv;
  
              vec4 noise = texture2D( lava1, vUv );
              vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
              vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;
  
              T1.x += noise.x * 2.0;
              T1.y += noise.y * 2.0;
              T2.x -= noise.y * 0.2;
              T2.y += noise.z * 0.2;
  
              float p = texture2D( lava1, T1 * 2.0 ).a;
  
              vec4 color = texture2D( lava1, T2 * 2.0 );
              vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );
  
              if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
              if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
              if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }
  
              gl_FragColor = temp;
  
              float depth = gl_FragCoord.z / gl_FragCoord.w;
              const float LOG2 = 1.442695;
              float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
              fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
  
              gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
  
          }
        `
    })
    
    // CUSTOM: video 
    const video = document.getElementById('video')
    const custom_video = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, 
      map: new THREE.VideoTexture( video ),
      alphaMap: new THREE.TextureLoader().load(require('@/assets/Alpha/softer.png')),
      transparent: true
    })
    video.play()
    
    //Set custom shader here 
    return new THREE.Mesh(geometry, custom_disco)
}
  