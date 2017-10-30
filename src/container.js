const THREE = require('three');
var mda = require('mda');


const Container = function(parent, app, geometry) {

    geometry = this.pipe(geometry, .001);

    var material = new THREE.MeshBasicMaterial({
        color: 0x888888
    });

    const mesh = new THREE.Mesh(geometry, material);

    parent.add(mesh);

    this.mesh = mesh;
};

Container.prototype.pipe = function(geometry, thickness) {

    const mesh = new mda.Mesh();
    var vertices = geometry.vertices.map(function(vert) {
        return [vert.x, vert.y, vert.z];
    });
    var cells = geometry.faces.map(function(face) {
        return [face.a, face.b, face.c];
    });

    mesh.setPositions(vertices);
    mesh.setCells(cells);
    mesh.process();

    vertices = [];
    cells = [];

    mesh.edges.forEach((edge, i) => {
        var n1 = this.faceNormal(mesh, edge.halfEdge.face);
        var n2 = this.faceNormal(mesh, edge.halfEdge.flipHalfEdge.face);
        n1.add(n2).normalize();
        edge.normal = n1;

        var v0 = new THREE.Vector3().fromArray(mesh.positions[edge.halfEdge.vertex.index]);
        var v1 = new THREE.Vector3().fromArray(mesh.positions[edge.halfEdge.flipHalfEdge.vertex.index]);
        
        edge.topPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(n1, v0);

        v0.sub(v1).cross(n1).normalize();

        var p1 = new THREE.Plane().setFromNormalAndCoplanarPoint(v0, v1);
        var p2 = p1.clone().negate();

        edge.halfEdge.sidePlane = p1;
        edge.halfEdge.flipHalfEdge.sidePlane = p2;
    });

    mesh.halfEdges.forEach((halfEdge, i) => {

        var nextHalfEdge = halfEdge.nextHalfEdge;

        var p1 = halfEdge.sidePlane.clone();
        var p2 = nextHalfEdge.sidePlane.clone();

        p1.constant -= thickness;
        p2.constant -= thickness;

        var ray = this.intersectPlanes(p1, p2);

        var topPlane = halfEdge.edge.topPlane.clone();
        var bottomPlane = halfEdge.edge.topPlane.clone();

        topPlane.constant -= thickness;
        bottomPlane.constant += thickness;

        var vTop = this.intersectRayPlane(ray, topPlane);
        var vBottom = this.intersectRayPlane(ray, bottomPlane);

        halfEdge.vTop = vTop;
        halfEdge.vBottom = vBottom;
        
        var idx = vertices.length;

        vertices.push(vTop.toArray());
        vertices.push(vBottom.toArray());

        halfEdge.vTopIndex = idx;
        halfEdge.vBottomIndex = idx + 1;
    });

    mesh.edges.forEach((edge, i) => {

        var he1 = edge.halfEdge;
        var he2 = he1.flipHalfEdge;
        var he3 = mda.HalfEdgePrev(he1);
        var he4 = mda.HalfEdgePrev(he2);

        cells.push([
            he1.vTopIndex,
            he1.vBottomIndex,
            he3.vBottomIndex,
            he3.vTopIndex
        ]);

        cells.push([
            he2.vTopIndex,
            he2.vBottomIndex,
            he4.vBottomIndex,
            he4.vTopIndex
        ]);

        cells.push([
            he1.vTopIndex,
            he3.vTopIndex,
            he2.vTopIndex,
            he4.vTopIndex
        ]);

        cells.push([
            he4.vBottomIndex,
            he2.vBottomIndex,
            he3.vBottomIndex,
            he1.vBottomIndex
        ]);
    });

    mesh.vertices.forEach((vert, i) => {
        var halfEdges = mda.VertexHalfEdges(vert).map((halfEdge) => {
            return halfEdge.flipHalfEdge;
        });

        var topCell = halfEdges.map((halfEdge) => halfEdge.vTopIndex);

        halfEdges.reverse();

        var bottomCell = halfEdges.map((halfEdge) => halfEdge.vBottomIndex);

        cells.push(topCell);
        cells.push(bottomCell);
    });

    const mesh2 = new mda.Mesh();
    mesh2.setPositions(vertices);
    mesh2.setCells(cells);
    mesh2.process();

    geometry = this.mdaToThree(mesh2);

    return geometry;
};

Container.prototype.faceNormal = function(mesh, face) {
    var verts = mda.FaceVertices(face)
        .slice(0, 3)
        .map((v) => new THREE.Vector3().fromArray(mesh.positions[v.index]));
    var plane = new THREE.Plane().setFromCoplanarPoints(verts[0], verts[1], verts[2]);
    return plane.normal;
};

Container.prototype.intersectPlanes = function(p1, p2) {
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

Container.prototype.intersectRayPlane = function(ray, plane) {
    var v = ray.intersectPlane(plane);
    if (v) {
        return v;
    }
    ray = ray.clone();
    ray.direction.negate();
    return ray.intersectPlane(plane);
};

Container.prototype.mdaToThree = function(mesh) {
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

Container.prototype.setVisible = function(value) {
    this.mesh.visible = value;
};

module.exports = Container;
