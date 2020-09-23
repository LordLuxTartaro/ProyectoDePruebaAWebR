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
    mouthOpened: false,
    balls: [],
  }),
  watch: {
    mouthOpened: function(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('The mouth is open: ', this.mouthOpened)
        this.createBall()
      }
    }
  },
  mounted(){

    this.stats = new Stats();
    this.$el.appendChild( this.stats.dom );

    this.texLoader = new THREE.TextureLoader()
    
    this.showCamera = true
  },
  methods: {
    createOccluder(){
      this.loaderGLTF = new GLTFLoader()

      this.loaderGLTF.setPath( '/assets/models/' );
      this.occluderMat = new THREE.MeshStandardMaterial({
        colorWrite: false
      })
      this.loaderGLTF.load( 'occluder.glb', ( gltf ) => {
        this.occluder = gltf.scene
        this.occluder.scale.set(0.5,0.5,0.5)
        this.occluder.position.set(0, 0.05, 0)
        this.occluder.traverse(child => {
          if (child.isMesh) {
            child.material = this.occluderMat
          }
        });

        this.headMesh.add( this.occluder );
      });
    },
    createBall(){
      let geom = new THREE.SphereGeometry( 0.07, 8, 8 );
      let material = new THREE.MeshPhongMaterial({transparent: true, opacity: 0.8});
      material.color = new THREE.Color().setHSL( Math.random(), 1, .5 );
      let ball = new THREE.Mesh( geom, material );

      // random position
      ball.position.set(0, -0.57, 0);

      ball.lifeCycle = 1

      this.balls.push( ball );
      this.headMesh.add( ball );
    },
    updateBalls(){
      for (let i = 0; i < this.balls.length; i++) {
        let ball = this.balls[i]
        if (ball) {

          if (ball.lifeCycle) ball.lifeCycle -= 0.05
  
          if (ball.position) {
            ball.position.z -= 0.2
          }
          if (ball.position.z > 0.1) ball.material.opacity = 1
          
          if (ball.lifeCycle <= 0) {
            this.headMesh.remove(ball)
            this.balls.splice(i, 1)
          }
        }
      }
    },
    createParts(){
      let geom = new THREE.SphereGeometry( 0.1, 8, 8 );
      let material = new THREE.MeshPhongMaterial({color: 0xff0000});
      this.rightEye = new THREE.Mesh( geom, material );
      this.leftEye = new THREE.Mesh( geom, material );

      this.headMesh.add(this.leftEye)
      this.headMesh.add(this.rightEye)

      let noseGeom = new THREE.SphereGeometry( 0.2, 8, 8 );
      let noseMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00});
      this.noseTip = new THREE.Mesh( noseGeom, noseMaterial );
      this.headMesh.add(this.noseTip)
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
      this.scene = scene

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

      
      this.createOccluder()
      this.createParts()
      this.hide()
  
      scene.add(this.headMesh)
    },
    update(event) {

      this.stats.begin()

      const detail = event.detail;
      const {vertices, normals, transform, attachmentPoints} = detail
  
      const {position, rotation, scale} = transform  // Update transform.
      this.headMesh.position.set(position.x, position.y, position.z)
      this.headMesh.setRotationFromQuaternion(rotation)
      this.headMesh.scale.set(scale, scale, scale)

      if (this.noseTip) {
        this.noseTip.position.copy(attachmentPoints.noseTip.position)
      }
      if (this.leftEye) {
        this.leftEye.position.copy(attachmentPoints.leftEye.position)
      }
      if (this.rightEye) {
        this.rightEye.position.copy(attachmentPoints.rightEye.position)
      }
  
      vertices.forEach((v, index)=> {  // Update the vertices
        if (index == 14) {
          let upVec3 = new THREE.Vector3(vertices[index].x, vertices[index].y, vertices[index].z)
          let downVec3 = new THREE.Vector3(vertices[index-1].x, vertices[index-1].y, vertices[index-1].z)
          let dist = upVec3.distanceTo( downVec3 )
          this.mouthOpened = dist > 0.05
          if (this.mouthOpened > 0.05) {
            this.createBall()
          }
        }
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
