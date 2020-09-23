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
import { MeshBasicMaterial } from 'three';
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
    occluder: null,
    clock: null,
    count: 25,
    radius: .075,
    range: 2,
    plus: new THREE.Vector3(),
    minus: new THREE.Vector3(),
    separation: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    relativeVelocity: new THREE.Vector3(),
  }),
  mounted(){

    this.stats = new Stats();
    this.$el.appendChild( this.stats.dom );

    this.texLoader = new THREE.TextureLoader()
    
    this.showCamera = true
  },
  methods: {
    loadModels(){
      this.loaderGLTF = new GLTFLoader()

      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      })

      this.loaderGLTF.setPath( '/assets/models/' );
      this.occluderMat = new THREE.MeshStandardMaterial({
        colorWrite: false
      })
      this.loaderGLTF.load( 'occluder.glb', ( gltf ) => {
        this.occluder = gltf.scene
        this.occluder.scale.set(1,1,1)
        this.occluder.position.set(0, 0.05, 0.2)
        this.occluder.traverse(child => {
          if (child.isMesh) {
            child.material = this.occluderMat
          }
        });

        this.headMesh.add( this.occluder );
      });
      console.log(this.headMesh.position)

      this.createBox()

      this.raycaster = new THREE.Raycaster()
    },
    createBox(){
      let box = new THREE.Geometry();
      box.vertices.push( new THREE.Vector3( -this.range, -this.range, -this.range ) );
      box.vertices.push( new THREE.Vector3( this.range, this.range, this.range ) );
      let boxMesh = new THREE.Line( box );
      this.headMesh.add( new THREE.BoxHelper( boxMesh, 'white' ) );

      this.balls = [];
      let geom = new THREE.SphereGeometry( this.radius, 16, 16 );

      for ( var i = 0 ; i < this.count ; i++ ) {
        
        let geometry = geom.clone()
        let material = new THREE.MeshPhongMaterial();
        material.color = new THREE.Color().setHSL( Math.random(), 1, .5 );
        let ball = new THREE.Mesh( geometry, material );

        // random position
        ball.position.set( ( this.range - this.radius ) * ( 2 * Math.random() - 1 ),
              ( this.range - this.radius ) * ( 2 * Math.random() - 1 ),
              ( this.range - this.radius ) * ( 2 * Math.random() - 1 ) );

        // random velocity
        let speed = .15;
        ball.v = new THREE.Vector3( speed * ( 2 * Math.random() - 1 ),
                speed * ( 2 * Math.random() - 1 ),
                speed * ( 2 * Math.random() - 1 ) );

        this.balls.push( ball );
        this.headMesh.add( ball );

      }
    },
    updateBalls(){
      for ( let i = 0 ; i < this.count ; i++ ) {

        let b1 = this.balls[i];

        this.plus.copy( b1.position ).addScalar( this.radius ).add( b1.v );
        this.minus.copy( b1.position ).subScalar( this.radius ).add( b1.v );

        // reverse velocity components at walls
        if ( this.plus.x > this.range || this.minus.x < -this.range ) b1.v.x = -b1.v.x;
        if ( this.plus.y > this.range || this.minus.y < -this.range ) b1.v.y = -b1.v.y;
        if ( this.plus.z > this.range || this.minus.z < -this.range ) b1.v.z = -b1.v.z;
        if ( b1.position.distanceTo( this.occluder.position ) < 0.98) {
          b1.v.x = -b1.v.x;
          b1.v.y = -b1.v.y;
          b1.v.z = -b1.v.z;
        }
        for ( let j = i + 1 ; j < this.count ; j++ ) {

          let b2 = this.balls[j];
          this.separation.copy( b1.position ).add( b1.v ).sub( b2.position ).sub( b2.v );

          // exchange normal velocities for collision, leave tangential alone
          if ( this.separation.length() < 2 * this.radius ) {

            this.normal.copy( b1.position ).sub( b2.position ).normalize();

            this.relativeVelocity.copy( b1.v ).sub( b2.v );
            let dot = this.relativeVelocity.dot( this.normal );

            this.normal = this.normal.multiplyScalar( dot );

            b1.v.sub( this.normal );
            b2.v.add( this.normal );

          }
        }

        b1.position.add( b1.v );

      }
      
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
      
      const {scene, camera} = XR8.Threejs.xrScene()  // Get the 3js scene from XR
      this.camera = camera

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

      this.material = new THREE.MeshStandardMaterial({
        colorWrite: false
      })
      this.geometry = creatGeom(this.modelGeometry)
      this.headMesh = new THREE.Mesh(this.geometry, this.material)

      this.loadModels()
      
      this.hide()
  
      scene.add(this.headMesh)
    },
    update(event) {

      this.stats.begin()

      const detail = event.detail;
      const {vertices, normals, transform} = detail
      
  
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
      
      let delta = this.clock.getDelta();

      this.updateBalls()
      
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
