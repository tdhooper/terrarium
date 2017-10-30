const THREE = require('three');
var mda = require('mda');


var wireframeMesh = function(geometry, thickness) {

    // Create half edge structure from geometry

    const mesh = threeToMda(geometry);


    // Buffers

    var vertices = [];
    var cells = [];


    // Find planes that lie along the top, and along the side of each edge

    var v0 = new THREE.Vector3();
    var v1 = new THREE.Vector3();

    mesh.edges.forEach((edge) => {

        var halfEdge = edge.halfEdge;
        var flipHalfEdge = halfEdge.flipHalfEdge;

        // Edge normal from adjacent faces

        var n1 = faceNormal(mesh, halfEdge.face);
        var n2 = faceNormal(mesh, flipHalfEdge.face);
        n1.add(n2).normalize();

        // Vertices at each end of the edge

        v0.fromArray(mesh.positions[halfEdge.vertex.index]);
        v1.fromArray(mesh.positions[flipHalfEdge.vertex.index]);

        // Top plane for edge

        edge.topPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(n1, v0);

        // Tangent to the edge normal

        v0.sub(v1).cross(n1).normalize();

        // Side planes for half edges

        var p1 = new THREE.Plane().setFromNormalAndCoplanarPoint(v0, v1);
        var p2 = p1.clone().negate();

        edge.halfEdge.sidePlane = p1;
        edge.halfEdge.flipHalfEdge.sidePlane = p2;
    });


    // Find new vertices for each corner (where two edges meet)

    mesh.halfEdges.forEach((halfEdge) => {

        // Offset the top plane to mark the top and bottom of the strut

        var topPlane = halfEdge.edge.topPlane.clone();
        var bottomPlane = halfEdge.edge.topPlane.clone();

        topPlane.constant -= thickness;
        bottomPlane.constant += thickness;

        // The halfEdge and nextHalfEdge make up a corner

        var nextHalfEdge = halfEdge.nextHalfEdge;

        // Offset each side plane to mark the sides of the struts

        var sidePlane1 = halfEdge.sidePlane.clone();
        var sidePlane2 = nextHalfEdge.sidePlane.clone();

        sidePlane1.constant -= thickness;
        sidePlane2.constant -= thickness;

        // Find the two points formed by the intersection of these planes

        var ray = intersectPlanes(sidePlane1, sidePlane2);
        var vTop = ray.intersectPlane(topPlane);
        var vBottom = ray.intersectPlane(bottomPlane);

        // Add to the list of vertices and store their positions

        var idx = vertices.length;

        vertices.push(vTop.toArray());
        vertices.push(vBottom.toArray());

        halfEdge.vTopIndex = idx;
        halfEdge.vBottomIndex = idx + 1;

        halfEdge.vTop = vTop;
        halfEdge.vBottom = vBottom;
    });


    // Connect the each edge's 8 corner vertices into a box

    mesh.edges.forEach((edge) => {

        var he1 = edge.halfEdge;
        var he2 = he1.flipHalfEdge;
        var he3 = mda.HalfEdgePrev(he1);
        var he4 = mda.HalfEdgePrev(he2);

        // Side face 1

        cells.push([
            he1.vTopIndex,
            he1.vBottomIndex,
            he3.vBottomIndex,
            he3.vTopIndex
        ]);

        // Side face 2

        cells.push([
            he2.vTopIndex,
            he2.vBottomIndex,
            he4.vBottomIndex,
            he4.vTopIndex
        ]);

        // Top face

        cells.push([
            he1.vTopIndex,
            he3.vTopIndex,
            he2.vTopIndex,
            he4.vTopIndex
        ]);

        // Bottom face

        cells.push([
            he4.vBottomIndex,
            he2.vBottomIndex,
            he3.vBottomIndex,
            he1.vBottomIndex
        ]);
    });


    // Connect the corner vertices surrounding each vertex into top and bottom panels

    mesh.vertices.forEach((vert) => {

        var halfEdges = mda.VertexHalfEdges(vert).map((halfEdge) => {
            return halfEdge.flipHalfEdge;
        });

        var topCell = halfEdges.map((halfEdge) => halfEdge.vTopIndex);

        halfEdges.reverse(); // So the normal faces out

        var bottomCell = halfEdges.map((halfEdge) => halfEdge.vBottomIndex);

        cells.push(topCell);
        cells.push(bottomCell);
    });


    // Convert n-sided faces into triangles

    const mesh2 = new mda.Mesh();
    mesh2.setPositions(vertices);
    mesh2.setCells(cells);
    mesh2.process();

    geometry = mdaToThree(mesh2);

    return geometry;
};


var faceNormal = function(mesh, face) {
    var verts = mda.FaceVertices(face)
        .slice(0, 3)
        .map((v) => new THREE.Vector3().fromArray(mesh.positions[v.index]));
    var plane = new THREE.Plane().setFromCoplanarPoints(verts[0], verts[1], verts[2]);
    return plane.normal;
};


var intersectPlanes = function(p1, p2) {

    // https://stackoverflow.com/questions/6408670/line-of-intersection-between-two-planes

    var p3Normal = p1.normal.clone().cross(p2.normal);
    var det = p3Normal.lengthSq();

    if ( ! det) {
        return;
    }

    var a = p3Normal.clone().cross(p2.normal).multiplyScalar(p1.constant);
    var b = p1.normal.clone().cross(p3Normal).multiplyScalar(p2.constant);

    var origin = a.add(b).divideScalar(det);
    var direction = p3Normal.normalize();

    return new THREE.Ray(origin, direction);
};


var threeToMda = function(geometry) {
    var vertices = geometry.vertices.map(function(vert) {
        return [vert.x, vert.y, vert.z];
    });
    var cells = geometry.faces.map(function(face) {
        return [face.a, face.b, face.c];
    });
    const mesh = new mda.Mesh();
    mesh.setPositions(vertices);
    mesh.setCells(cells);
    mesh.process();
    return mesh;
};


var mdaToThree = function(mesh) {
    mda.TriangulateOperator(mesh);
    var positions = mesh.getPositions();
    var cells = mesh.getCells();
    var geometry = new THREE.Geometry();
    geometry.vertices = positions.map(function(position) {
        return new THREE.Vector3().fromArray(position);
    });
    geometry.faces = cells.map(function(cell) {
        return new THREE.Face3(cell[0], cell[1], cell[2]);
    });
    return geometry;
};


module.exports = {
    wireframeMesh: wireframeMesh
};
