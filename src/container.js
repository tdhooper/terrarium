const THREE = require('three');
var mda = require('mda');


const Container = function(parent, app, geometry) {
    
    this.parent = parent;


    geometry = this.pipe(geometry);
    geometry.computeFlatVertexNormals();

    var material = new THREE.MeshBasicMaterial({
        color: 0x555555
    });
    material = new THREE.MeshNormalMaterial();
    // material.wireframe = true;
    // material.side = THREE.DoubleSide;
    this.material = material;
    // material.wireframe = true;

    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);

    // app.interactionPublisher.add(mesh, 'container', true);

    this.geometry = geometry;
    this.mesh = mesh;
};

Container.prototype.pipe = function(geometry) {
    var offset = .05;

    const mesh = new mda.Mesh();
    var vertices = geometry.vertices.map(function(vert) {
        return [vert.x, vert.y, vert.z];
    });
    var cells = geometry.faces.map(function(face) {
        return [face.a, face.b, face.c];
    });

    // var vertices = [
    //     [0, 0, 0],
    //     [0, 0, 1],
    //     [1, 0, .2],
    //     [0, 1, .5]
    // ];

    // var cells = [
    //     [0, 2, 1],
    //     [0, 3, 2],
    //     [3, 1, 2],
    //     [3, 0, 1]
    // ];

    mesh.setPositions(vertices);
    mesh.setCells(cells);
    mesh.process();

    geometry = this.mdaToThree(mesh);

    vertices = [];
    cells = [];

    /*

    for each face
        for each half edge
            add end vertices for side

    for each edge, join sides

    for each vertex, join ends
    */

    var parent = this.parent;
    var material = new THREE.MeshNormalMaterial();
    material.side = THREE.DoubleSide;

    
    function addEdgeNormalHelper(edge) {
        var o1 = new THREE.Vector3().fromArray(mesh.positions[edge.halfEdge.vertex.index]);
        var o2 = new THREE.Vector3().fromArray(mesh.positions[edge.halfEdge.flipHalfEdge.vertex.index]);
        o1.lerp(o2, .5);
        var arrowHelper = new THREE.ArrowHelper(edge.normal, o1, 1, 0xff0000);
        parent.add( arrowHelper );
    }

    function addTVertexHelper(v) {
        var g = new THREE.SphereGeometry(.02);
        var m = new THREE.Mesh(g, material);
        m.position.copy(v);
        parent.add(m);
    }

    function addVertexHelper(vert) {
        var g = new THREE.SphereGeometry(.02);
        var m = new THREE.Mesh(g, material);
        var v = mesh.positions[vert.index];
        m.position.fromArray(v);
        parent.add(m);
    }

    function addPlaneHelper(plane) {
        var p = new THREE.PlaneGeometry(2.5, 2.5);
        var m = new THREE.Mesh(p, material);
        m.lookAt(plane.normal);
        m.position.copy(plane.normal);
        m.position.multiplyScalar(plane.constant * -1);
        parent.add(m);
    }

    // find normal for each vertex
    // find top and bottom points from each vertex normal
    // store on the vertex

    // for each face
        // get verts
        // use mda to contract verts
        // assign new verts to corresponding half edges

    // For each half edge, create two quads
    // 1. halfedge.vert.top + halfedge.side + nextHalfedge.side + nextHalfedge.vert.top
    // 1. halfedge.vert.bottom + halfedge.side + nextHalfedge.side + nextHalfedge.vert.bottom



    mesh.edges.forEach((edge, i) => {
        // if (i !== 3) {
        //     return;
        // }
        var n1 = this.faceNormal(mesh, edge.halfEdge.face);
        var n2 = this.faceNormal(mesh, edge.halfEdge.flipHalfEdge.face);
        n1.add(n2).normalize();
        edge.normal = n1;

        // addVertexHelper(edge.halfEdge.vertex);
        // addVertexHelper(edge.halfEdge.nextHalfEdge.vertex);
        // addVertexHelper(edge.halfEdge.nextHalfEdge.nextHalfEdge.vertex);
        // addEdgeNormalHelper(edge);

        var v0 = new THREE.Vector3().fromArray(mesh.positions[edge.halfEdge.vertex.index]);
        var v1 = new THREE.Vector3().fromArray(mesh.positions[edge.halfEdge.flipHalfEdge.vertex.index]);
        
        edge.topPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(n1, v0);
        // edge.topPlane.constant *= -1; // THREE Gets it wrong??

        v0.sub(v1).cross(n1).normalize();
        // parent.add(new THREE.ArrowHelper(v0, v1, 1, 0x00ff00));

        var p1 = new THREE.Plane().setFromNormalAndCoplanarPoint(v0, v1);
        // p1.constant *= -1; // THREE Gets it wrong??

        // addPlaneHelper(p1);
        
        var p2 = p1.clone().negate();

        // addPlaneHelper(p2);
        

        edge.halfEdge.sidePlane = p1;
        edge.halfEdge.flipHalfEdge.sidePlane = p2;

        // addPlaneHelper(p2);

        // addPlaneHelper(p2);
    });

    // return geometry;

    // for each halfedge
    // get next halfedge
    // add points at intersection

    mesh.halfEdges.forEach((halfEdge, i) => {
        if (i !== 4) {
            // return;
        }

        var nextHalfEdge = halfEdge.nextHalfEdge;

        var p1 = halfEdge.sidePlane.clone();
        var p2 = nextHalfEdge.sidePlane.clone();


        p1.constant -= offset;
        p2.constant -= offset;

        // addPlaneHelper(p1);
        // addPlaneHelper(p2);


        var ray = this.intersectPlanes(p1, p2);

        // this.parent.add(new THREE.ArrowHelper(ray.direction, ray.origin, 1, 0x0000ff));

        var topPlane = halfEdge.edge.topPlane.clone();
        var bottomPlane = halfEdge.edge.topPlane.clone();

        topPlane.constant -= offset;
        bottomPlane.constant += offset;

        // addPlaneHelper(bottomPlane);

        // addEdgeNormalHelper(halfEdge.edge);

        // topPlane.constant *= -1;
        // bottomPlane.constant *= -1;
        
        var vTop = this.intersectRayPlane(ray, topPlane);
        var vBottom = this.intersectRayPlane(ray, bottomPlane);

        halfEdge.vTop = vTop;
        halfEdge.vBottom = vBottom;
        
        var idx = vertices.length;

        vertices.push(vTop.toArray());
        vertices.push(vBottom.toArray());

        halfEdge.vTopIndex = idx;
        halfEdge.vBottomIndex = idx + 1;

        // addTVertexHelper(halfEdge.vTop);
        // addTVertexHelper(halfEdge.vBottom);
    });

    // return geometry;

    mesh.edges.forEach((edge, i) => {

        // if (i !== 4) {
        //     return;
        // }

        var he1 = edge.halfEdge;
        var he2 = he1.flipHalfEdge;
        var he3 = mda.HalfEdgePrev(he1);
        var he4 = mda.HalfEdgePrev(he2);

        // addEdgeNormalHelper(edge);

        // addTVertexHelper(he1.vTop);
        // addTVertexHelper(he1.vBottom);
    
        // addTVertexHelper(he2.vTop);
        // addTVertexHelper(he2.vBottom);
        
        // addTVertexHelper(he3.vTop);
        // addTVertexHelper(he3.vBottom);

        // addTVertexHelper(he4.vTop);
        // addTVertexHelper(he4.vBottom);

        var su = he1;

        var vert = mesh.positions[mda.HalfEdgePrev(su).vertex.index];

        // if (vert[0] == 0 && vert[1] < .01 && vert[1] > -.5 && vert[2] > 0) {
        //     console.log(i);
        //     addTVertexHelper(new THREE.Vector3().fromArray(vert));
        //     addEdgeNormalHelper(su.edge);
        //     //addPlaneHelper(topPlane);
        //     // console.log(su);
        //     // addPlaneHelper(su.sidePlane);
        //     addTVertexHelper(su.vTop);
        //     addTVertexHelper(su.vBottom);
        // }

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
        if (i !== 0) {
            // return;
        }
        var halfEdges = mda.VertexHalfEdges(vert).map((halfEdge) => {
            return halfEdge.flipHalfEdge;
        });


        halfEdges.forEach((halfEdge) => {
            // addTVertexHelper(halfEdge.vTop);
            // addTVertexHelper(halfEdge.vBottom);
            // addPlaneHelper(halfEdge.edge.topPlane);
        });

        var topCell = halfEdges.map((halfEdge) => halfEdge.vTopIndex);

        halfEdges.reverse();

        var bottomCell = halfEdges.map((halfEdge) => halfEdge.vBottomIndex);

        // bottomCell = [bottomCell[2], bottomCell[1], bottomCell[0]];

        cells.push(topCell);
        cells.push(bottomCell);


    });

    // return geometry;

    console.log(cells);


    const mesh2 = new mda.Mesh();
    mesh2.setPositions(vertices);
    mesh2.setCells(cells);
    mesh2.process();

    console.log(mda.MeshIntegrity(mesh2));

    console.log(mesh2);

    geometry = this.mdaToThree(mesh2);


    // mesh.faces.forEach((face, i) => {
    //     if (i !== 2) {
    //         return;
    //     }
    //     mda.FaceHalfEdges(face).forEach((halfEdge, j) => {
    //         if (j !== 2) {
    //             return;
    //         }

    //         var prevHalfEdge = mda.HalfEdgePrev(halfEdge);

    //         var e1 = halfEdge.edge;
    //         var e2 = prevHalfEdge.edge;

    //         var n1 = e1.normal;
    //         var n2 = e2.normal;
    //         var v0 = new THREE.Vector3().fromArray(mesh.positions[halfEdge.vertex.index]);
    //         var v1 = new THREE.Vector3().fromArray(mesh.positions[halfEdge.nextHalfEdge.vertex.index]);
    //         var v2 = new THREE.Vector3().fromArray(mesh.positions[prevHalfEdge.vertex.index]);
    

    //         addVertexHelper(halfEdge.vertex);
    //         // addVertexHelper(halfEdge.nextHalfEdge.vertex);
    //         addVertexHelper(prevHalfEdge.vertex);
            
    //         addEdgeNormalHelper(e2);
    //         // addEdgeNormalHelper(e2);
            
    //         v1.sub(v0).cross(n1).normalize().negate();
    //         v2.sub(v0).cross(n2).normalize();

    //         parent.add(new THREE.ArrowHelper(v2, v0, 1, 0x00ff00));

    //         var p1 = new THREE.Plane().setFromNormalAndCoplanarPoint(v1, v0);
    //         var p2 = new THREE.Plane().setFromNormalAndCoplanarPoint(v1, v1);

    //         // get edge normal
    //         // get next halfedge edge normal
    //         // get planes for strut sides
    //         // find line for intersecting planes
    //         // get plane for strut top & bottom
    //         // intersect line with planes
    //     });
    // });

    /*

    var vert1 = new THREE.Vector3();
    var vert2 = new THREE.Vector3();
    var tOriginalVert = new THREE.Vector3();

    var plane = new THREE.Plane();
    // var vert3 = new THREE.Vector3();

    var offset = .2;
    var adjacentFaces = [];

    mesh.vertices.forEach((vert, i) => {
        if (i !== 0) {
            return;
        }

        var originalVert = mesh.positions[vert.index];
        tOriginalVert.fromArray(originalVert);
        vertices.push(originalVert);
        var idx = vertices.length - 1;

        var extruded = mda.VertexHalfEdges(vert).map((halfEdge) => {
            var v1 = halfEdge.flipHalfEdge.vertex;
            var v2 = halfEdge.nextHalfEdge.flipHalfEdge.vertex;
            var verts = [vert, v1, v2]
                .map((v) => new THREE.Vector3().fromArray(mesh.positions[v.index]));
            plane.setFromCoplanarPoints(verts[0], verts[1], verts[2]);

            verts[1].sub(verts[0]).normalize();
            verts[2].sub(verts[0]).normalize();

            var h = (offset * .2) / Math.sin(verts[1].angleTo(verts[2]) / 2);

            verts[1].lerp(verts[2], .5).normalize();

            console.log(verts[1].angleTo(verts[1]));
            verts[1].multiplyScalar(h);

            verts[0].add(verts[1]);
            // return verts[0].toArray();

            plane.normal.multiplyScalar(offset);
            plane.normal.add(verts[0]);
            // plane.normal.add(verts[1]);
            return plane.normal.toArray();
        });

        // half the angle, fund hypotenuse from opposite
        // soh cah toa
        // sin(a) = o / h
        // h*sin(a) = o
        // h = o / sin(a)

        // var faces = mda.VertexHalfEdges(vert).map((halfEdge) => halfEdge.face);
        // // var faces = mda.VertexFaces(vert);
        // var originalVert = mesh.positions[vert.index];
        // vertices.push(originalVert);
        // var idx = vertices.length - 1;
        // tOriginalVert.fromArray(originalVert);
        // var extruded = faces.map((face) => {
        //     var verts = mda.FaceVertices(face)
        //         .slice(0, 3)
        //         .map((v) => new THREE.Vector3().fromArray(mesh.positions[v.index]));
        //     plane.setFromCoplanarPoints(verts[0], verts[1], verts[2]);
        //     plane.normal.multiplyScalar(offset);
        //     plane.normal.add(tOriginalVert);
        //     return plane.normal.toArray();
        // });

        vertices = vertices.concat(extruded);

        var cellIdx = cells.length;

        var newCells = extruded.map(function(v, i) {
            var a = 0;
            var b = i + 1;
            var c = (i + 2) % extruded.length + 1;
            return [idx + b, idx + c, idx + a];
        });
        cells = cells.concat(newCells);

        var endCap = extruded.map(function(v, i) {
            return idx + i + 1;
        });
        cells.push(endCap);

        mda.VertexHalfEdges(vert).forEach(function(halfEdge, i) {
            var edge = halfEdge.edge;
            var endCells = edge.endCells = edge.endCells || [];
            endCells.push(cellIdx + i);
        });

        // newCells map to vertex edges

        // for each new face
        // get its edge
        // add the new face to it's edge 

    });

    vertices.forEach((v) => {
        var g = new THREE.SphereGeometry(.05);
        var m = new THREE.Mesh(g, this.material);
        m.position.fromArray(v);
        this.parent.add(m);
    });
    console.log(mesh);

    console.log(cells);

    const mesh2 = new mda.Mesh();
    mesh2.setPositions(vertices);
    mesh2.setCells(cells);
    mesh2.process();


    // mesh.edges.forEach((edge, i) => {
    //     if (i !== 4) {
    //         // return;
    //     }
    //     mda.PipeOperator(mesh2, edge.endCells[0], edge.endCells[1]);
    // });

    */
    return geometry;

    // console.log(mda.MeshIntegrity(mesh));

    // console.log(mesh2);

    // return this.mdaToThree(mesh2);
};

Container.prototype.faceNormal = function(mesh, face) {
    var verts = mda.FaceVertices(face)
        .slice(0, 3)
        .map((v) => new THREE.Vector3().fromArray(mesh.positions[v.index]));
    var plane = new THREE.Plane().setFromCoplanarPoints(verts[0], verts[1], verts[2]);
    return plane.normal;
};

Container.prototype.intersectPlanesB = function(planeA, planeB) {
    var x1 = planeA.normal.x,
        y1 = planeA.normal.y,
        z1 = planeA.normal.z,
        d1 = planeA.constant;

    var x2 = planeB.normal.x,
        y2 = planeB.normal.y,
        z2 = planeB.normal.z,
        d2 = planeB.constant;

    var c = 0; // the desired value for the x-coordinate

    var v = new THREE.Vector4( d1, d2, c, 1 );

    var m = new THREE.Matrix4().set( x1, y1, z1, 0, 
                               x2, y2, z2, 0,
                               1,  0,  0,  0,
                               0,  0,  0,  1
                             );

    var minv = new THREE.Matrix4().getInverse( m );

    console.log(minv);

    v.applyMatrix4( minv );

    var origin = new THREE.Vector3(v.x, v.y, v.z);
    var direction = planeA.normal.clone().cross(planeB.normal).normalize();

    return new THREE.Ray(origin, direction);
};


Container.prototype.intersectPlanes = function(p1, p2) {
    // logically the 3rd plane, but we only use the normal component.
    var p3Normal = p1.normal.clone().cross(p2.normal);
    var det = p3Normal.lengthSq();

    // If the determinant is 0, that means parallel planes, no intersection.
    // note: you may want to check against an epsilon value here.
    if ( ! det) {
        return;
    }
        // calculate the final (point, normal)

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
