<template>
  <div class="experience">
    <CameraFeed
      v-if="showCamera"
      :initFace="init"
      :updateFace="update"
      :hideFace="hide"
      :onDetachFace="onDetach"
      ref="cameraFeed"
    />
  </div>
</template>

<script>
const THREE = require('three');
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import CameraFeed from "@/components/CameraFeed";
import { creatGeom, creatMat } from '@/classes/Face3DUtils'
import Stats from 'stats-js'
export default {
  name: 'experience',
  components: {
    CameraFeed
  },
  data: () => ({
    showCamera: false,
    raycaster: null,
    geometry: null,
    material: null,
    uniforms: null,
    canvas: null,
    modelGeometry: null,
    headMesh: null,
    uniforms: null,
    clock: null,
    vertexShader: null,
    fragmentShader: null,
  }),
  mounted(){

    this.stats = new Stats();
    this.$el.appendChild( this.stats.dom );

    this.texLoader = new THREE.TextureLoader()

    this.loadShaders()
    
    this.uniforms = {
      "fogDensity": { value: 0.45 },
      "fogColor": { value: new THREE.Vector3( 0, 0, 0 ) },
      "iResolution": { value: new THREE.Vector2( window.innerWidth, window.innerHeight ) },
      "iTime": { value: 1.0 },
      "iChannel0": { value:  this.texLoader.load( require('@/assets/Custom/wood.jpg') ) },
      "uvScale": { value: new THREE.Vector2( 3.0, 1.0 ) },
      "vorTex": { value:  this.texLoader.load( require('@/assets/Custom/tex-vortex/spiral.png') ) },
      "lava1": { value:  this.texLoader.load( require('@/assets/Custom/lava/cloud.png') ) },
      "lava2": { value:  this.texLoader.load( require('@/assets/Custom/lava/lavatile.jpg') ) }
    }
      
    this.uniforms[ "vorTex" ].value.wrapS = this.uniforms[ "vorTex" ].value.wrapT = THREE.RepeatWrapping
    
    this.uniforms[ "lava1" ].value.wrapS = this.uniforms[ "lava1" ].value.wrapT = THREE.RepeatWrapping
    this.uniforms[ "lava2" ].value.wrapS = this.uniforms[ "lava2" ].value.wrapT = THREE.RepeatWrapping
    
    this.showCamera = true
  },
  methods: {
    loadHDR(){
      new RGBELoader()
        .setDataType( THREE.UnsignedByteType )
        .setPath( '/assets/textures/' )
        .load( 'royal_esplanade_1k.hdr', ( texture ) => {

          const {renderer, scene} = XR8.Threejs.xrScene()
          const pmremGenerator = new PMREMGenerator(renderer)

          // var envMap = pmremGenerator.fromEquirectangular( texture ).texture;

          texture.dispose();
          pmremGenerator.dispose();

          // model
          // use of RoughnessMipmapper is optional
          // var roughnessMipmapper = new RoughnessMipmapper( renderer );

          this.loaderGLTF = new GLTFLoader()

          const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            envMap: texture,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
          })

          this.loaderGLTF.setPath( '/assets/models/' );
          this.occluderMat = new THREE.MeshStandardMaterial({
            colorWrite: false
          })
          this.loaderGLTF.load( 'occluder.glb', ( gltf ) => {
            const model = gltf.scene
            model.scale.set(0.85,1,1.2)
            model.position.set(0, 0.05, 0.2)
            model.traverse(child => {
              if (child.isMesh) {
                child.material = this.occluderMat
              }
            });

            this.headMesh.add( model );
            // roughnessMipmapper.dispose();
            console.log(model)
          });

          
          this.loaderGLTF.setPath( '/assets/models/aviators/' );
          this.loaderGLTF.load( 'glasses.glb', ( gltf ) => {
            const model = gltf.scene
            model.scale.set(0.9,0.9,0.9)
            model.position.set(0, 0.0, 0.05)
            model.rotation.set(-0.175, 0, 0)
            model.traverse(child => {
              if (child && child.material) {
                if (child.material.name == 'Lenses_mat') {
                  child.material = glassMaterial
                }
              }
              // if ( child.isMesh ) {
                
                //   child.material.envMap = envMap
              //   roughnessMipmapper.generateMipmaps( child.material );
              // }
            });

            this.headMesh.add( model );
            // roughnessMipmapper.dispose();
            console.log(model)
          });
      });
    },
    async loadShaders(){
        this.vertexShader = await this.loadTextFile("assets/shaders/first-vs.glsl")
        this.fragmentShader = await this.loadTextFile("assets/shaders/godrays-fs.glsl")
    },
    init({canvas, detail}) {
      if (this.headMesh) {
        return
      }
      
      this.canvas = this.canvas || canvas
      this.modelGeometry = this.modelGeometry || detail
      
      if (!(this.canvas && this.modelGeometry)) {
        return
      }
      
      const {scene} = XR8.Threejs.xrScene()  // Get the 3js scene from XR
      
      this.clock = new THREE.Clock()
  
      const targetObject = new THREE.Object3D()
      targetObject.position.set(0, 0, -1)
      scene.add(targetObject)
  
      const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 )
      directionalLight.castShadow = true
      directionalLight.position.set(0, 0.25, 0)
      directionalLight.target = targetObject
      scene.add(directionalLight)
      
      var bounceLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3)
      scene.add( bounceLight )

       // Tattoo
      // '8-tat.png', 'mesh-black.png', 'mesh-grad.png'
      // this.material = new THREE.MeshBasicMaterial({
      //   map: this.texLoader.load(require('@/assets/Tattoos/makeup.png')),
      //   alphaMap: this.texLoader.load(require('@/assets/Alpha/soft.png')),
      //   transparent: true,  
      //   opacity: 0.8
      // })

      this.material = new THREE.MeshStandardMaterial({
        colorWrite: false
      })
      
      
      this.material = creatMat(this.uniforms, this.vertexShader, this.fragmentShader)
      this.geometry = creatGeom(this.modelGeometry)
      this.headMesh = new THREE.Mesh(this.geometry, this.material)

      this.loadHDR()
      
      this.hide()
  
      scene.add(this.headMesh)
    },
    update(event) {

      this.stats.begin()

      const detail = event.detail;
      const {vertices, normals, transform} = detail
      
      var delta = this.clock.getDelta();
      this.uniforms['iTime'].value += delta * 2;
  
      const {position, rotation, scale} = transform  // Update transform.
      this.headMesh.position.set(position.x, position.y, position.z)
      this.headMesh.setRotationFromQuaternion(rotation)
      this.headMesh.scale.set(scale, scale, scale)
  
      vertices.forEach((v, index)=> {  // Update the vertices
        this.headMesh.geometry.vertices[index].x = v.x
        this.headMesh.geometry.vertices[index].y = v.y
        this.headMesh.geometry.vertices[index].z = v.z
      })
      this.headMesh.geometry.verticesNeedUpdate = true
      
      this.headMesh.geometry.faces.forEach((face) => {  // Update the normals.
        face.vertexNormals[0].copy(normals[face.a])
        face.vertexNormals[1].copy(normals[face.b])
        face.vertexNormals[2].copy(normals[face.c])
      })
      this.headMesh.geometry.normalsNeedUpdate = true
      
    //   this.headMesh.material
      
      this.headMesh.visible = true

      this.stats.end()
    },
    onDetach() {
      this.canvas = null
      this.modelGeometry = null
    },
    hide() {
      this.headMesh.visible = false
    },
    loadTextFile(url) {
      return this.$http.get(url).then(response => {
          if (response.status && response.status == 200) {
              return response.body
          }
      }, err => {
          console.log('loadTextFile error', wrr)
      });
    },
    convertToVector (points) {
      let resultPoints = []
      for (let i = 0; i < points.length; i = i + 3) {
          let vectorPoint = new THREE.Vector3(points[i], points[i + 1], points[i + 2])
          resultPoints.push(vectorPoint)
      }
      return resultPoints
    }
  }
}
</script>

<style scoped lang="scss">
.experience {
  @include set-size(100%, 100%);
  position: relative;
}
</style>
