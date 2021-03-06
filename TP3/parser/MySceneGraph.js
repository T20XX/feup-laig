function MySceneGraph(filename, scene) {
    this.loadedOk = null ;
    // Data structure needed to store all dsx file information
    this.root = null ;
    // Root component id
    this.axisLength = null ;
    // Axis length
    this.defaultView = null ;
    // Default view id
    this.views = [];
    // Views/cameras
    this.illumination = null ;
    // Illumination
    this.lights = [];
    // Omni and spot lights
    this.textures = [];
    // Textures
    this.materials = [];
    // Materials
    this.transformations = [];
    // Transformations
    this.primitives = [];
    // Primitives
    this.components = [];
    // Components
    this.animations = [];
    // Animations
    // Establish bidirectional references between scene and graph
    this.scene = scene;
    scene.graph = this;
    // File reading 
    this.reader = new CGFXMLreader();
    /*
	 * Read the contents of the xml file, and refer to this class for loading and error handlers.
	 * After the file is read, the reader calls onXMLReady on this object.
	 * If any error occurs, the reader calls onXMLError on this object, with an error message
	 */
    this.reader.open('scenes/' + filename, this);
}
/*
 * Callback to be executed after successful reading
 */
MySceneGraph.prototype.onXMLReady = function() {
    console.log("XML Loading finished.");
    var rootElement = this.reader.xmlDoc.documentElement;
    // Here should go the calls for different functions to parse the various blocks
    //var error = this.parseGlobalsExample(rootElement);
    var error = this.parseGlobals(rootElement);
    var error = this.parseViews(rootElement);
    var error = this.parseIllumination(rootElement);
    var error = this.parseTextures(rootElement);
    var error = this.parseMaterials(rootElement);
    var error = this.parseLights(rootElement);
    var error = this.parseTransformations(rootElement);
    var error = this.parseAnimations(rootElement);
    var error = this.parsePrimitives(rootElement);
    var error = this.parseComponents(rootElement);
    if (error != null ) {
        this.onXMLError(error);
        return;
    }
    this.loadedOk = true;
    // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
    this.scene.onGraphLoaded();
}
MySceneGraph.prototype.toRGBA = function(element) {
    var tmpData = {
        r: 0,
        g: 0,
        b: 0,
        a: 1
    };
    tmpData.r = this.reader.getFloat(element, 'r');
    tmpData.g = this.reader.getFloat(element, 'g');
    tmpData.b = this.reader.getFloat(element, 'b');
    tmpData.a = this.reader.getFloat(element, 'a');
    //////console.log(tmpData.r + " " + tmpData.g + " " + tmpData.b + " " + tmpData.a)
    return tmpData;
}
MySceneGraph.prototype.to4Vector = function(element) {
    var point4v = {
        x: 0,
        y: 0,
        z: 0,
        w: 1.0
    };
    point4v.x = this.reader.getFloat(element, "x");
    point4v.y = this.reader.getFloat(element, "y");
    point4v.z = this.reader.getFloat(element, "z");
    point4v.w = this.reader.getFloat(element, "w");
    return point4v;
}
MySceneGraph.prototype.to3Vector = function(element) {
    var point3v = {
        x: 0,
        y: 0,
        z: 0,
    };
    point3v.x = this.reader.getFloat(element, "x");
    point3v.y = this.reader.getFloat(element, "y");
    point3v.z = this.reader.getFloat(element, "z");
    return point3v;
}
MySceneGraph.prototype.to3VectorDouble = function(element) {
    var point3v = {
        x: 0,
        y: 0,
        z: 0,
    };
    point3v.x = this.reader.getFloat(element, "xx");
    point3v.y = this.reader.getFloat(element, "yy");
    point3v.z = this.reader.getFloat(element, "zz");
    return point3v;
}
MySceneGraph.prototype.parseGlobals = function(rootElement) {
    var elems = rootElement.getElementsByTagName('scene');
    if (elems == null ) {
        return "globals element is missing.";
    }
    if (elems.length != 1) {
        return "either zero or more than one 'globals' element found.";
    }
    // various examples of different types of access
    var globals = elems[0];
    this.root = this.reader.getString(globals, 'root');
    this.axisLength = this.reader.getFloat(globals, 'axis_length');
    //console.log("Globals read from file: {root=" + this.root + ", axis_length=" + this.axisLength + "}");
}
;
MySceneGraph.prototype.parseViews = function(rootElement) {
    var elems = rootElement.getElementsByTagName('views');
    if (elems == null || elems.length == 0) {
        return "materials element is missing or is more than one";
    }
    var views = elems[0];
    this.defaultView = this.reader.getString(views, 'default');
    //console.log("Default view: " + this.defaultView);
    // iterate over every element	
    var nnodes = elems[0].children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = elems[0].children[i];
        var id = this.reader.getString(e, 'id');
        var near = this.reader.getFloat(e, 'near');
        var far = this.reader.getFloat(e, 'far');
        var angle = this.reader.getFloat(e, 'angle');
        var fromVector = this.to3Vector(e.getElementsByTagName('from')[0]);
        var toVector = this.to3Vector(e.getElementsByTagName('to')[0]);
        this.views[id] = new View(near,far,angle,fromVector,toVector);
        //console.log("View read from file: {id=" + id + ", near=" + near + ", far=" + far + ", angle=" + angle + "}");
    }
}
MySceneGraph.prototype.parseIllumination = function(rootElement) {
    var elems = rootElement.getElementsByTagName('illumination');
    if (elems == null ) {
        return "illumination element is missing.";
    }
    if (elems.length != 1) {
        return "either zero or more than one 'illumination' element found.";
    }
    // various examples of different types of access
    var illumination = elems[0];
    var doublesided = this.reader.getBoolean(illumination, 'doublesided');
    var local = this.reader.getBoolean(illumination, 'local');
    var ambient = this.toRGBA(illumination.children[0]);
    var background = this.toRGBA(illumination.children[1]);
    this.illumination = new Illumination(doublesided,local,ambient,background);
    //console.log("Illumination read from file: {doublesided=" + doublesided + ", local=" + local + "}");
}
MySceneGraph.prototype.parseLights = function(rootElement) {
    var elems = rootElement.getElementsByTagName('lights');
    if (elems == null || elems.length == 0) {
        return "textures element is missing.";
    }
    var lights = elems[0];
    var nnodes = lights.children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = lights.children[i];
        var id = this.reader.getString(e, 'id');
        var enabled = this.reader.getBoolean(e, 'enabled');
        var ambient = this.toRGBA(e.getElementsByTagName('ambient')[0]);
        var diffuse = this.toRGBA(e.getElementsByTagName('diffuse')[0]);
        var specular = this.toRGBA(e.getElementsByTagName('specular')[0]);
        if (e.tagName == "spot") {
            var location = this.to3Vector(e.getElementsByTagName('location')[0]);
            var target = this.to3Vector(e.getElementsByTagName('target')[0]);
            var angle = this.reader.getFloat(e, 'angle');
            var exponent = this.reader.getFloat(e, 'exponent');
            this.lights[id] = new Light(false,enabled,location,ambient,diffuse,specular,target,angle,exponent);
        } else {
            var location = this.to4Vector(e.getElementsByTagName('location')[0]);
            this.lights[id] = new Light(true,enabled,location,ambient,diffuse,specular);
        }
        //console.log("Light read from file: {id=" + this.lights[id].getLocation().x + ", enabled=" + enabled + ", location=" + location + ", ambient=" + ambient + ", diffuse=" + diffuse + ", specular=" + specular + ", angle=" + angle + ", exponent=" + exponent + "}");
    }
}
MySceneGraph.prototype.parseTextures = function(rootElement) {
    var tempList = rootElement.getElementsByTagName('textures');
    if (tempList == null || tempList.length == 0) {
        return "textures element is missing.";
    }
    this.textures = [];
    // iterate over every element
    var nnodes = tempList[0].children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = tempList[0].children[i];
        var file = e.attributes.getNamedItem("file").value;
        var s = e.attributes.getNamedItem("length_s").value;
        var t = e.attributes.getNamedItem("length_t").value;
        var texture = new Texture(file,s,t);
        // process each element and store its information
        this.textures[e.id] = texture;
        //console.log("Read textures item id " + e.id + " from file " + file + " with length s: " + s + " and length t: " + t);
    }
}
MySceneGraph.prototype.parseMaterials = function(rootElement) {
    var elems = rootElement.getElementsByTagName('materials');
    if (elems == null || elems.length == 0) {
        return "materials element is missing or is more than one";
    }
    // iterate over every element	
    var nnodes = elems[0].children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = elems[0].children[i];
        var emission = this.toRGBA(e.getElementsByTagName("emission")[0]);
        var ambient = this.toRGBA(e.getElementsByTagName("ambient")[0]);
        var diffuse = this.toRGBA(e.getElementsByTagName("diffuse")[0]);
        var specular = this.toRGBA(e.getElementsByTagName("specular")[0]);
        var shininess = this.reader.getFloat(e.getElementsByTagName("shininess")[0], 'value');
        var material = new Material(emission,ambient,diffuse,specular,shininess);
        this.materials[e.id] = material;
    }
    //console.log("Read material item id " + e.id);
}
MySceneGraph.prototype.parseTransformations = function(rootElement) {
    var tempList = rootElement.getElementsByTagName('transformations');
    if (tempList == null || tempList.length == 0) {
        return "textures element is missing.";
    }
    this.transformations = [];
    var transformations = tempList[0];
    var nnodes = transformations.children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = transformations.children[i];
        this.transformations[e.id] = new Transformation();
        for (var j = 0; j < e.children.length; j++) {
            var transf = e.children[j];
            switch (transf.tagName) {
            case 'translate':
                var translating = this.to3Vector(transf);
                this.transformations[e.id].applyTranslation(translating);
                //console.log("Read translate item id " + e.id + "x: " + translating.x + "y: " + translating.y + "z: " + translating.z);
                break;
            case 'rotate':
                var rotate_axis = this.reader.getString(transf, 'axis');
                var rotate_angle = this.reader.getFloat(transf, 'angle') * Math.PI / 180;
                this.transformations[e.id].applyRotation(rotate_axis, rotate_angle);
                //console.log("Read rotation item id " + e.id + "axis: " + rotate_axis + "angle: " + rotate_angle);
                break;
            case 'scale':
                var scaling = this.to3Vector(transf);
                this.transformations[e.id].applyScaling(scaling);
                //console.log("Read scale item id " + e.id + "x: " + scaling.x + "y: " + scaling.y + "z: " + scaling.z);
                break;
                transformations[e.id] = new Transformation();
            }
        }
    }
}
;
MySceneGraph.prototype.parseAnimations = function(rootElement) {
    var elems = rootElement.getElementsByTagName('animations');
    if (elems == null || elems.length == 0) {
        return "animations element is missing.";
    }
    this.animations = [];
    // iterate over every element
    var nnodes = elems[0].children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = elems[0].children[i];
        var id = this.reader.getString(e, 'id');
        var span = this.reader.getFloat(e, 'span');
        var type = this.reader.getString(e, 'type');
        if (type == "linear") {
            var controlPoints = [];
            for (var j = 0; j < e.children.length; j++) {
                controlPoints.push(this.to3VectorDouble(e.children[j]));
            }
            this.animations[id] = new LinearAnimation(span,controlPoints);
            //console.log("Read linear animation with ID: " + id + ", span: " + span + ", controlPoints: " + controlPoints);
        } else if (type == "circular") {
            var centerx = this.reader.getFloat(e, 'centerx');
            var centery = this.reader.getFloat(e, 'centery');
            var centerz = this.reader.getFloat(e, 'centerz');
            var radius = this.reader.getFloat(e, 'radius');
            var startang = this.reader.getFloat(e, 'startang');
            var rotang = this.reader.getFloat(e, 'rotang');
            this.animations[id] = new CircularAnimation(span,centerx,centery,centerz,radius,startang,rotang);
            //console.log("Read circular animation with ID: " + id + ", span: " + span + ", centerX: " + centerx + ", centerY: " + centery + ", centerZ: " + centerz + ", radius: " + radius + ", startAng: " + startang + ", rotAng: " + rotang);
        }
    }
}
;
MySceneGraph.prototype.parsePrimitives = function(rootElement) {
    var tempList = rootElement.getElementsByTagName('primitives');
    if (tempList == null || tempList.length == 0) {
        return "primitives element is missing.";
    }
    this.primitives = [];
    // iterate over every element
    var nnodes = tempList[0].children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = tempList[0].children[i];
        var prim = e.children[0];
        switch (prim.nodeName) {
        case "rectangle":
            var x1 = this.reader.getFloat(prim, 'x1');
            var y1 = this.reader.getFloat(prim, 'y1');
            var x2 = this.reader.getFloat(prim, 'x2');
            var y2 = this.reader.getFloat(prim, 'y2');
            this.primitives[e.id] = new Rectangle(this.scene,x1,y1,x2,y2);
            break;
        case "triangle":
            var x1 = this.reader.getFloat(prim, 'x1');
            var y1 = this.reader.getFloat(prim, 'y1');
            var z1 = this.reader.getFloat(prim, 'z1');
            var x2 = this.reader.getFloat(prim, 'x2');
            var y2 = this.reader.getFloat(prim, 'y2');
            var z2 = this.reader.getFloat(prim, 'z2');
            var x3 = this.reader.getFloat(prim, 'x3');
            var y3 = this.reader.getFloat(prim, 'y3');
            var z3 = this.reader.getFloat(prim, 'z3');
            this.primitives[e.id] = new Triangle(this.scene,x1,y1,z1,x2,y2,z2,x3,y3,z3);
            break;
        case "cylinder":
            var base = this.reader.getFloat(prim, 'base');
            var top = this.reader.getFloat(prim, 'top');
            var height = this.reader.getFloat(prim, 'height');
            var slices = this.reader.getInteger(prim, 'slices');
            var stacks = this.reader.getInteger(prim, 'stacks');
            this.primitives[e.id] = new Cylinder(this.scene,base,top,height,slices,stacks);
            break;
        case "sphere":
            var radius = this.reader.getFloat(prim, 'radius');
            var slices = this.reader.getInteger(prim, 'slices');
            var stacks = this.reader.getInteger(prim, 'stacks');
            this.primitives[e.id] = new Sphere(this.scene,radius,slices,stacks);
            break;
        case "torus":
            var inner = this.reader.getFloat(prim, 'inner');
            var outer = this.reader.getFloat(prim, 'outer');
            var slices = this.reader.getInteger(prim, 'slices');
            var loops = this.reader.getInteger(prim, 'loops');
            this.primitives[e.id] = new Torus(this.scene,inner,outer,slices,loops);
            break;
        case "plane":
            var dimX = this.reader.getFloat(prim, 'dimX');
            var dimY = this.reader.getFloat(prim, 'dimY');
            var partsX = this.reader.getInteger(prim, 'partsX');
            var partsY = this.reader.getInteger(prim, 'partsY');
            this.primitives[e.id] = new Plane(this.scene,dimX,dimY,partsX,partsY);
            break;
        case "patch":
            var orderU = this.reader.getFloat(prim, 'orderU');
            var orderV = this.reader.getFloat(prim, 'orderV');
            var partsU = this.reader.getInteger(prim, 'partsU');
            var partsV = this.reader.getInteger(prim, 'partsV');
            if (prim.children.length == (orderU + 1) * (orderV + 1)) {
                var controlPoints = [];
                for (var j = 0; j < prim.children.length; j++) {
                    controlPoints.push(this.to3Vector(prim.children[j]));
                    //console.log(controlPoints[j].x, controlPoints[j].y, controlPoints[j].z);
                }
                this.primitives[e.id] = new Patch(this.scene,orderU,orderV,partsU,partsV,controlPoints);
            }
            break;
        case "vehicle":
            this.primitives[e.id] = new Vehicle(this.scene);
            break;
        case "chessboard":
            var du = this.reader.getInteger(prim, 'du');
            var dv = this.reader.getInteger(prim, 'dv');
            var textureref = this.reader.getString(prim, 'textureref');
            var su = this.reader.getInteger(prim, 'su');
            var sv = this.reader.getInteger(prim, 'sv');
            var c1 = this.toRGBA(prim.children[0]);
            var c2 = this.toRGBA(prim.children[1]);
            var cs = this.toRGBA(prim.children[2]);

            this.primitives[e.id] = new Chessboard(this.scene, du, dv, this.textures[textureref], su, sv, c1, c2, cs);
            break;
        }
        //console.log("Read primitives item id " + e.id + prim.nodeName + this.primitives[e.id]);
    }
}
;
MySceneGraph.prototype.parseComponents = function(rootElement) {
    var elems = rootElement.getElementsByTagName('components');
    if (elems == null || elems.length == 0) {
        return "components element is missing.";
    }
    this.components = [];
    // iterate over every element
    var nnodes = elems[0].children.length;
    for (var i = 0; i < nnodes; i++) {
        var e = elems[0].children[i];
        var temp_animations = [];
        for (var k = 0; k < e.children.length; k++) {
            switch (e.children[k].nodeName) {
            case "transformation":
                var transf = e.children[k];
                var temp_transf = new Transformation();
                for (var j = 0; j < transf.children.length; j++) {
                    switch (transf.children[j].tagName) {
                    case 'translate':
                        var translating = this.to3Vector(transf.children[j]);
                        temp_transf.applyTranslation(translating);
                        //console.log("Read translate item id " + e.id + "x: " + translating.x + "y: " + translating.y + "z: " + translating.z);
                        break;
                    case 'rotate':
                        var rotate_axis = this.reader.getString(transf.children[j], 'axis');
                        var rotate_angle = this.reader.getFloat(transf.children[j], 'angle') * Math.PI / 180;
                        temp_transf.applyRotation(rotate_axis, rotate_angle);
                        //console.log("Read rotation item id " + e.id + "axis: " + rotate_axis + "angle: " + rotate_angle);
                        break;
                    case 'scale':
                        var scaling = this.to3Vector(transf.children[j]);
                        temp_transf.applyScaling(scaling);
                        //console.log("Read scale item id " + e.id + "x: " + scaling.x + "y: " + scaling.y + "z: " + scaling.z);
                        break;
                    case 'transformationref':
                        //console.log(temp_transf.getMatrix());
                        //console.log("READ tranformation item id " + (this.transformations[this.reader.getString(transf.children[j], "id")]).getMatrix());
                        temp_transf.multMatrix((this.transformations[this.reader.getString(transf.children[j], "id")]).getMatrix());
                        //console.log(temp_transf.getMatrix());
                        break;
                    }
                }
                break;
            case "animation":
                var anims = e.children[k];
                for (var j = 0; j < anims.children.length; j++) {
                    temp_animations.push(this.animations[this.reader.getString(anims.children[j], "id")]);
                }
                break;
            case "materials":
                var mat = e.children[k];
                var temp_mat = [];
                for (var j = 0; j < mat.children.length; j++) {
                    temp_mat[j] = mat.children[j].id;
                    //console.log("MATERIAL COMPONENT ID :" + mat.children[j].id + " DO COMP" + e.id);
                }
                break;
            case "texture":
                var textu = e.children[k];
                var temp_text = textu.id;
                //console.log("TEXTURE COMPONENT ID :" + textu.id + " DO COMP" + e.id);
                break;
            case "children":
                var childrenc = e.children[k];
                var temp_child = [];
                for (var j = 0; j < childrenc.children.length; j++) {
                    temp_child[j] = childrenc.children[j].id;
                    //console.log("CHILDREN COMPONENT ID :" + childrenc.children[j].id + " DO COMP" + e.id);
                }
                break;
            }
        }
        //console.log(temp_animations);
        this.components[e.id] = new Component(temp_transf,temp_mat,temp_text,temp_child,temp_animations);
        ////console.log("Read components item id "+ e.id +  transf.nodeName + transf.children[j].nodeName);
    }
    ////console.log("Read components item id "+ e.id + transf.nodeName);
}
;
/*
 * Callback to be executed on any read error
 */
MySceneGraph.prototype.onXMLError = function(message) {
    console.error("XML Loading Error: " + message);
    this.loadedOk = false;
}
