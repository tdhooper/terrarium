var cga = require('cga');
const THREE = require('three');
const ThreeBSP = require('./lib/three-js-csg')(THREE);
const sliceGeometry = require('threejs-slice-geometry')(THREE);


const Soil = function(parent, container, app) {

    container.computeBoundingBox();
    const size = container.boundingBox.getSize();

    this.width = size.x;
    this.depth = size.z;
    this.height = size.y * .1;
    this.offset = size.y * .2;

    const material = new THREE.MeshNormalMaterial({
        // color: 0x000000,
        // shininess: 0,
        wireframe: true,
        // side: THREE.DoubleSide
    });

    var sections = 5;

    var surface = new THREE.ParametricGeometry(
        this.generate.bind(this),
        sections, sections
    );

    var addHelper = function(v) {
        var g = new THREE.SphereGeometry(.05);
        var m = new THREE.Mesh(g);
        m.position.copy(v);
        parent.add(m);
    };

    var res = sections + 1;
    var bottom = -5;

    this.res = res;

    surface.vertices.push(new THREE.Vector3(this.width * .5, bottom, this.depth * .5));
    surface.vertices.push(new THREE.Vector3(this.width * -.5, bottom, this.depth * .5));
    surface.vertices.push(new THREE.Vector3(this.width * .5, bottom, this.depth * -.5));
    surface.vertices.push(new THREE.Vector3(this.width * -.5, bottom, this.depth * -.5));

    var baseIndicies = [
        surface.vertices.length - 1,
        surface.vertices.length - 2,
        surface.vertices.length - 3,
        surface.vertices.length - 4
    ];

    var sideIndices, bottomIndices;

    // -x face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return i;
    });
    bottomIndices = [
        baseIndicies[2],
        baseIndicies[0]
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);

    // +x face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return (sections + 1) * sections + i;
    });
    sideIndices.reverse();
    bottomIndices = [
        baseIndicies[1],
        baseIndicies[3]
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);

    // -z face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return (sections + 1) * i;
    });
    sideIndices.reverse();
    bottomIndices = [
        baseIndicies[0],
        baseIndicies[1]
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);

    // +z face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return (sections + 1) * i + sections;
    });
    bottomIndices = [
        baseIndicies[3],
        baseIndicies[2]
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);

    // base
    surface.faces.push(new THREE.Face3(
        baseIndicies[0],
        baseIndicies[1],
        baseIndicies[2]
    ));
    surface.faces.push(new THREE.Face3(
        baseIndicies[3],
        baseIndicies[2],
        baseIndicies[1]
    ));


    container.faces.forEach((face, i) => {
        if (i < 42 || i > 43) {
            return;
        }
        // if (i !== 43) {
        //     return;
        // }
        // if (i > 0) {
        //     return;
        // }
        var plane = new THREE.Plane().setFromCoplanarPoints(
            container.vertices[face.b],
            container.vertices[face.a],
            container.vertices[face.c]
        );
        surface = sliceGeometry(surface, plane, true);
    });

    surface.computeFaceNormals();

    // const containerBSP = new ThreeBSP(container);
    // const surfaceBSP = new ThreeBSP(surface);


    // // Visible soil

    // const geomBSP = containerBSP.intersect(surfaceBSP);
    // const geometry = geomBSP.toGeometry();

    var geometry = surface;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    parent.add(mesh);

    this.mesh = mesh;


    // // Interactive area of the soil

    // var interactiveBSP = surfaceBSP.cut(containerBSP);
    // var interactiveGeom = interactiveBSP.toGeometry();
    // var interactiveMesh = new THREE.Mesh(interactiveGeom, material);
    // interactiveMesh.visible = false;
    // parent.add(interactiveMesh);

    // app.interactionPublisher.add(interactiveMesh, 'soil-area', true);


    // // Clean normals for the soil

    // surface.computeFaceNormals();
    // var normalMesh = new THREE.Mesh(surface, material);
    // normalMesh.visible = false;
    // parent.add(normalMesh);

    // app.interactionPublisher.add(normalMesh, 'soil-normals', true);
};

Soil.prototype.addSideFaces = function(geometry, sideIndices, bottomIndices) {
    sideIndices.forEach((index, i) => {
        if (i >= sideIndices.length - 1) {
            return;
        } 
        var a = i >= this.res / 2 ? bottomIndices[0] : bottomIndices[1];
        var b = sideIndices[i + 1];
        var c = sideIndices[i];
        geometry.faces.push(new THREE.Face3(a, b, c));
    });
    geometry.faces.push(new THREE.Face3(
        bottomIndices[1],
        bottomIndices[0],
        sideIndices[Math.round(sideIndices.length / 2)]
    ));
};

Soil.prototype.generate = function(u, v) {
    const z = (u - .5) * this.width;
    const x = (v - .5) * this.depth;
    var y = Math.sin(x * 5) * Math.sin(z * 2) * .5 * this.height;
    y -= this.offset;
    return new THREE.Vector3(x, y, z);
};

Soil.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Soil;
