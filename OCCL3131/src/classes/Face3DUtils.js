export const creatGeom = (modelGeometry) => {
  const geometry = new THREE.Geometry()
  
  // fill the geometry with default vertices
  for (let index = 0; index < modelGeometry.pointsPerDetection; index++) {
    geometry.vertices.push(new THREE.Vector3())
  }

  // add the UVs to the geometry
  const uvs = []
  for (let index = 0; index < modelGeometry.uvs.length; ++index) {
    const uv = modelGeometry.uvs[index]
    uvs.push(new THREE.Vector2(uv.u, uv.v))
  }

    // add the indices to the geometry to connect the vertices
  const {indices} = modelGeometry
  for (let i = 0; i < indices.length; i += 1) {
    const idxs = indices[i]
    const f = new THREE.Face3(idxs.a, idxs.b, idxs.c)
    f.vertexNormals[0] = new THREE.Vector3()
    f.vertexNormals[1] = new THREE.Vector3()
    f.vertexNormals[2] = new THREE.Vector3()
    geometry.faces.push(f)
    geometry.faceVertexUvs[0].push([uvs[idxs.a], uvs[idxs.b], uvs[idxs.c]])
  }
    

  return geometry
}

export const creatMat = (uniforms, vs, fs) => {
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vs,
    fragmentShader: fs
  })

  return material
}