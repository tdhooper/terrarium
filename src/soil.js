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

    const material = new THREE.MeshPhongMaterial({
        color: 0x000000,
        shininess: 0,
        wireframe: true
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
    var bottom = -1;

    this.res = res;

    surface.vertices.push(new THREE.Vector3(this.width * .5, bottom, this.depth * .5));
    surface.vertices.push(new THREE.Vector3(this.width * -.5, bottom, this.depth * .5));
    surface.vertices.push(new THREE.Vector3(this.width * .5, bottom, this.depth * -.5));
    surface.vertices.push(new THREE.Vector3(this.width * -.5, bottom, this.depth * -.5));

    // addHelper(surface.vertices[surface.vertices.length - 1]);
    // addHelper(surface.vertices[surface.vertices.length - 2]);
    // addHelper(surface.vertices[surface.vertices.length - 3]);
    // addHelper(surface.vertices[surface.vertices.length - 4]);

    // create corner vertices

    // get top vertices for edge
    // get bottom vertices
    // create a new list of 2d vertices
    // create a map from the 2d index to the geom vertex index
    // triangulate
    // for each triangle, add face using map

    var sideIndices, bottomIndices;

    // -x face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return i;
    });
    bottomIndices = [
        surface.vertices.length - 3,
        surface.vertices.length - 1,
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);

    // +x face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return (sections + 1) * sections + i;
    });
    sideIndices.reverse();
    bottomIndices = [
        surface.vertices.length - 2,
        surface.vertices.length - 4
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);

    // -z face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return (sections + 1) * i;
    });
    sideIndices.reverse();
    bottomIndices = [
        surface.vertices.length - 1,
        surface.vertices.length - 2,
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);

    // +z face
    sideIndices = [...Array(sections + 1)].map(function(v, i) {
        return (sections + 1) * i + sections;
    });
    bottomIndices = [
        surface.vertices.length - 4,
        surface.vertices.length - 3,
    ];
    this.addSideFaces(surface, sideIndices, bottomIndices);




    // bottomIndices.forEach(i => {
    //     var vertex = surface.vertices[i];
    //     addHelper(vertex);
    // });

    // sideIndices.push(sideIndices.pop());
    // this.addSideFaces(surface, sideIndices);




    parent.add(new THREE.AxisHelper(1));


    // for (var u = 0; u <= res * 2; u++) {
    //     // for (var v = 0; v < res * 2; v++) {
    //         var x = (((u % res) / (res - 1)) - .5) * this.width;
    //         var z = u > res ? this.depth * .5 : this.depth * -.5;
    //         var vertex = new THREE.Vector3(
    //             x,-this.offset,z
    //         );
    //         addHelper(vertex);
    //     // }
    // }


    // container.faces.forEach(face => {
    //     var plane = new THREE.Plane().setFromCoplanarPoints(
    //         container.vertices[face.b],
    //         container.vertices[face.a],
    //         container.vertices[face.c]
    //     );
    //     surface = sliceGeometry(surface, plane);
    // });

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
