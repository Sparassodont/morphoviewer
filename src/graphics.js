
/**
 * This file adds graphical utilities to the morphoviewer namespace.
 * */
var morphoviewer = ( function( module ) {
    //this is a namespace scope helper function for Program
    function getShaderFromDOM( gl, domId ) {
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById( domId );

        if ( !shaderScript ) {
            alert("getShaderFromDOM: no such shader: " + domId );
            return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while ( currentChild) {
            if ( currentChild.nodeType == currentChild.TEXT_NODE ) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }

        //create the shader object
        if ( shaderScript.type == "x-shader/x-fragment" ) {
            shader = getShaderFromString( gl, theSource, "fragment" );
        } else if ( shaderScript.type == "x-shader/x-vertex" ) {
            shader = getShaderFromString( gl, theSource, "vertex" );
        } else {
            //Unknown shader type
            alert( "getShaderFromDOM: unknown shader type, returning null." );
            return null;
        }
        return shader;
    }

    //helper function for Program
    function getShaderFromString( gl, sourceStr, type ) {
        var shader;
        //create the shader object
        if ( type == "fragment" ) {
            shader = gl.createShader( gl.FRAGMENT_SHADER );
        } else if ( type == "vertex" ) {
            shader = gl.createShader( gl.VERTEX_SHADER );
        } else {
            //Unknown shader type
            alert( "getShaderFromString: unknown shader type, returning null." );
            return null;
        }

        //pass the source into the shader object & compile
        gl.shaderSource( shader, sourceStr );

        gl.compileShader( shader );

        //check if compilation was succesful
        if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
            alert( "getShaderFromString: could not compile " + type + " shader: " +
                gl.getShaderInfoLog( shader ) );
            return null;
        }
        return shader;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Shader program class
    /////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @class Creates a webGL shader program containing a vertex shader and fragment shader.
     * @name Program
     *
     * @param {Object} gl a valid webGL context
     */
    module.Program = function( gl ) {
        this.gl = gl;
        this.object = null;

        //this.setUniforms
    };

    function getProgram( gl, vertObject, fragObject ) {
        var program = gl.createProgram();
        //link the objects to create shader program
        gl.attachShader( program, vertObject );
        gl.attachShader( program, fragObject );
        gl.linkProgram( program );
        //if linking failure, then log info:
        if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
            console.log( "getProgram: unable to link the shader program " +
                gl.getProgramInfoLog( program ) );
        }
        return program;
    }

    module.Program.prototype.programFromDOM = function( vertexId, fragmentId ) {
        //first, get the shader objects
        var frag = getShaderFromDOM( this.gl, fragmentId );
        var vert = getShaderFromDOM( this.gl, vertexId );

        this.object = getProgram( this.gl, vert, frag );
    };

    module.Program.prototype.programFromString = function( vertexStr, fragmentStr ) {
        var vert = getShaderFromString( this.gl, vertexStr, "vertex" );
        var frag = getShaderFromString( this.gl, fragmentStr, "fragment" );

        this.object = getProgram( this.gl, vert, frag );
    };

    /**
     * Make WebGL use this program object.
     */
    module.Program.prototype.use = function() {
        this.gl.useProgram( this.object );
    };

    /**
     * Query whether this program object is currently in use by WebGL.
     *
     * @returns {Boolean} true, if in use, false otherwise.
     */
    module.Program.prototype.isInUse = function() {
        var currentProgram = 0;
        //this.gl.getIntegerv( this.gl.GL_CURRENT_PROGRAM, currentProgram );
        if ( this.object == currentProgram ) {
            return true;
        }
        return false;
    };

    /**
     * Stops WebGL from using this program object by binding the current program slot to zero.
     */
    module.Program.prototype.stopUsing = function() {
        if ( this.isInUse() ) {
            this.gl.useProgram( null );
        }
    };

    /**
     * Query the location of an attribute.
     *
     * @param {String} attributeId the name of the attribute in the shader
     * @returns {Number} the location of the attribute
     */
    module.Program.prototype.attribute = function( attributeId ) {
        var attrib = this.gl.getAttribLocation( this.object, attributeId );
        if ( attrib == -1 ) {
            console.log( "Program.attribute: shader attribute " + attributeId + " not found." );
            return null;
        }

        return attrib;
    };

    /**
     * Query the location of a uniform in the shader
     *
     * @param {String} uniformId the name of the uniform in the shader
     * @returns {Number} the location of the uniform
     */
    module.Program.prototype.uniform = function( uniformId ) {
        var uniform = this.gl.getUniformLocation( this.object, uniformId );
        if ( uniform == -1 ) {
            console.log( "Program.uniform: shader uniform " + uniformId + " not found." );
            return null;
        }

        return uniform;
    };

    /**
     * Set a uniform to a specific value
     *
     * @param {String} uniformId
     * @param {Object} value the value can be a number, or gl-matrix type, such as vec3
     * @param {Object} opts the option syntax is { "type": "TYPE" }, where TYPE is float/vec3/vec4/mat4
     */
    module.Program.prototype.setUniform = function( uniformId, value, opts ) {
        switch ( opts.type ) {
            case "float": this.gl.uniform1f( this.uniform( uniformId ), value );
                break;
            case "vec3": this.gl.uniform3fv( this.uniform( uniformId ), value );
                break;
            case "vec4": this.gl.uniform4fv( this.uniform( uniformId), value );
                break;
            case "mat3": this.gl.uniformMatrix3fv( this.uniform( uniformId ), value );
                break;
            case "mat4": this.gl.uniformMatrix4fv( this.uniform( uniformId ), false, value );
                break;
            case "int": this.gl.uniform1i( this.uniform( uniformId ), value );
                break;
            default: console.log("Program.setUniform: unknown type " + opts["type"] );
        }
    };
	
	/////////////////////////////////////////////////////////////////////////////////////////
    // BufferObject class
    /////////////////////////////////////////////////////////////////////////////////////////
	module.BufferObject = function( gl, target ) {
		this.gl = gl;
		this.target = target;
		this.object = this.gl.createBuffer();
	};
	
	module.BufferObject.prototype.dataStore = function( data, type ) {
		this.bind();
		this.gl.bufferData( this.target, data, type );
		this.unbind();
	};
	
	module.BufferObject.prototype.bind = function() {
		this.gl.bindBuffer( this.target, this.object );
	};
	
	module.BufferObject.prototype.unbind = function() {
		this.gl.bindBuffer( this.target, null );
	};

    /////////////////////////////////////////////////////////////////////////////////////////
    // Mesh class
    /////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @class This class is a wrapper for vertex buffer objects.
     *
     * @param {Object} gl a valid WebGL context
     */
    module.Mesh = function( gl ) {
        this.gl = gl;
        this.vbo = null;	//vertex buffer object must be {Object}
        this.numVertices = 0;
        this.contains = {
            vertex: false, barycentric: false, normal: false,
            curvature: false, orientation: false
        };
    };

    /**
     * Get the value of the vertex buffer object.
     *
     * @returns {Number} the vertex buffer object
     */
    module.Mesh.prototype.object = function() {
        return this.vbo;
    };

    /**
     * @param {Object} obj an object containing the following fields: { vertex: [],
     * normal: [], curvature: [], orientation: [] }
     * */
    module.Mesh.prototype.build = function( obj ) {
        var N = obj.vertex.length;
        var buf = [];
        if ( obj.vertex !== undefined ) {
            buf = obj.vertex.slice();
            this.numVertices = buf.length / 3.0;
            this.contains["vertex"] = true;
            var barycentric = new Array( buf.length );// vertexArray.length );
            for ( var i = 0; i < this.numVertices * 3; i += 9 ) {
                barycentric[i] = 1.0;
                barycentric[i+1] = 0.0;
                barycentric[i+2] = 0.0;
                barycentric[i+3] = 0.0;
                barycentric[i+4] = 1.0;
                barycentric[i+5] = 0.0;
                barycentric[i+6] = 0.0;
                barycentric[i+7] = 0.0;
                barycentric[i+8] = 1.0;
            }
            buf = buf.concat( barycentric );
            this.contains["barycentric"] = true;
        } else {
            alert( "morphoviewer.Mesh.build error: no vertices supplied!" );
        }
        if ( obj.normal !== undefined ) {
            buf = buf.concat( obj.normal );
            this.contains["normal"] = true;
        }
        if ( obj.curvature !== undefined ) {
            buf = buf.concat( obj.curvature );
            this.contains["curvature"] = true;
        }
        if ( obj.orientation !== undefined ) {
            buf = buf.concat( obj.orientation );
            this.contains["orientation"] = true;
        }
        this.vbo = this.gl.createBuffer();
        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vbo );
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array( buf ),
            this.gl.STATIC_DRAW
        );
        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );
    };

    /**
     * Check if this mesh instance has "vertex", "normal", "barycentric", "curvature" or "orientation" data.
     *
     * @param {String} bufType
     * @returns {Boolean} true if contained, false otherwise */
    module.Mesh.prototype.has = function( bufType ) {
        return this.contains[bufType];
    };

    /**
     * Query the number of distinct vertices that the contained mesh has.
     *
     * @return {Number} the number of vertices
     */
    module.Mesh.prototype.vertices = function() {
        return this.numVertices;
    };

    /**
     * Bind the contained vertex buffer object to the ARRAY_BUFFER target.
     */
    module.Mesh.prototype.bind = function() {
        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vbo );
    };

    /**
     * Bind the null object to the ARRAY_BUFFER target.
     */
    module.Mesh.prototype.unbind = function() {
        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, null );
    };

    /////////////////////////////////////////////////////////////////////////////////////////
    // Camera class
    /////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @class Contains methods for manipulating the properties, position & orientation
     * of the viewport.
     * @name Camera
     *
     * @param {Number} fov the vertical field of view, in radians
     * @param {Number} ar the aspect ratio
     * @param {Number} near the distance of the near plane from the camera
     * @param {Number} far the distance of the far plane from the camera
     */
    module.Camera = function( fov, ar, near, far ) {
        //position
        this.position = vec3.fromValues( 0.0, 0.0, 2.0 );
        this.targetPosition = vec3.fromValues( 0.0, 0.0, 2.0 );

        this.targetRadius = 2.0;
        this.radius = 10.0;

        this.polar = Math.PI / 2.0;
        this.azimuth = 0.0;

        this.viewTransform = mat4.create();

        this.sensitivity = 0.1 * this.radius;

        // perspective projection frustum
        //good default values are fov: 67 degrees, aspectRatio: 1.333, near: 0.01, far: 100
        this.verticalFOV = fov;
        this.aspectRatio = ar;
        this.nearPlane = near;
        this.farPlane = far;

        this.viewPerspective = false;
        this.zoomFactor = 1.0;	//for orthographic projection dolly zoom
        this.targetZoomFactor = 1.0;
    };

    module.Camera.prototype.setFOV = function( val ) {
        this.verticalFOV = val;
        if ( this.verticalFOV <= 0.0 ) {
            this.verticalFOV = Math.abs( this.verticalFOV );
        }
    };

    module.Camera.prototype.matrix = function() {
        return mat4.multiply( mat4.create(), this.perspective(), this.view() );
    };

    module.Camera.prototype.viewAsOrtho = function() {
        this.viewPerspective = false;
    };

    module.Camera.prototype.viewAsPerspective = function() {
        this.viewPerspective = true;
    };

    /**
     * @returns {mat4} the perspective matrix of the camera
     */
    module.Camera.prototype.perspective = function() {
        var m;
        if ( this.viewPerspective ) {
            m = mat4.perspective(
                mat4.create(),
                this.verticalFOV,
                this.aspectRatio,
                this.nearPlane,
                this.farPlane
            );
        } else {
            m = mat4.ortho(
                mat4.create(),
                //the box needs to have the same size as the canvas!
                //the 0.01 factor should not be changed, or it breaks the
                //calculation of optimal zoom factor for model
                -lerp( this.nearPlane, this.farPlane,
                        this.aspectRatio * 0.01 * this.zoomFactor ),
                lerp( this.nearPlane, this.farPlane,
                        this.aspectRatio * 0.01 * this.zoomFactor ),
                -lerp( this.nearPlane, this.farPlane, 0.01 * this.zoomFactor ),
                lerp( this.nearPlane, this.farPlane, 0.01 * this.zoomFactor ),
                this.nearPlane,
                this.farPlane
            );
        }
        return m;
    };

    /**
     * @returns {mat4} the view matrix (combined rotation and translation matrix) of the camera
     */
    module.Camera.prototype.view = function() {
        return this.viewTransform;
    };
    
    /**
     *@returns {Number} the camera's distance from the origin
     * */
    module.Camera.prototype.distanceFromOrigin = function() {
        return this.radius;
    };

    /**
     * @param {Number} fov the vertical field of view, in radians
     */
    module.Camera.prototype.setFOV = function( fov ) {
        if ( fov < 0.0 ) {
            throw "Camera.setFOV: negative vertical field of view";
        }
        this.verticalFOV = fov;
    };

    module.Camera.prototype.setAspectRatio = function( ar ) {
        if ( ar < 0.0 ) {
            throw "Camera.setAspectRatio: negative aspect ratio";
        }
        this.aspectRatio = ar;
    };

    module.Camera.prototype.setNearPlane = function( near ) {
        if ( near > this.farPlane ) {
            throw "Camera.setNearPlane: near plane is farther than the far plane";
        }
        this.nearPlane = near;
    };

    module.Camera.prototype.setFarPlane = function( far ) {
        if ( far < this.nearPlane ) {
            throw "Camera.setFarPlane: far plane is nearer than the near plane";
        }
        this.farPlane = far;
    };

    /**
     * Dolly along the Z axis of the camera's local transform
     */
    module.Camera.prototype.dolly = function( movez ) {
        this.targetRadius += this.sensitivity * movez;
        if ( this.targetRadius < 0 ) {
            this.targetRadius = 0.001;
        }
    };

    /**
     * Orbit about the focal point
     */
    module.Camera.prototype.orbit = function( movex, movey ) {
        this.polar -= movey;
        this.polar = clamp( this.polar, 0.01, Math.PI );
        this.azimuth -= movex;
    };

    function clamp( val, min, max ){
        if ( val < min ) {
            val = min;
        } else if ( val > max ) {
            val = max;
        }
        return val;
    }

    /*Parameters are intended to be
     * a {Number}
     * b {Number}
     * t {Number} in [0,1]*/
    function lerp( a, b, t ) {
        if ( t > 1 ) t = 1;
        return a + t * ( b - a );
    }

    module.Camera.prototype.update = function( dt ) {
        /*targetZoomFactor defines how wide the orthographic projection is, as there
         * is no depth.
         * this relation was arrived at by trial and error
         * when switching between perspective and ortho, the object does not change size*/
        this.targetZoomFactor = 0.07 * this.targetRadius;

        //update values
        this.zoomFactor = lerp( this.zoomFactor, this.targetZoomFactor, dt * 20 );
        this.radius = lerp( this.radius, this.targetRadius, dt * 20 );
        this.sensitivity = 0.1 * this.radius;

        var offset = vec3.fromValues(
            Math.sin( this.polar ) * Math.sin( this.azimuth ),
            Math.cos( this.polar ),
            Math.sin( this.polar ) * Math.cos( this.azimuth )
        );

        this.targetPosition = vec3.scale(
            vec3.create(),
            offset,
            this.radius
        );
        vec3.lerp( this.position, this.position, this.targetPosition, dt * 20 );

        mat4.lookAt(
            this.viewTransform,
            this.position,
            vec3.create( 0.0, 0.0, 0.0 ),
            this.up()
        );
    };

    /**
     * Sets the camera to a position where the target object is centered and in full view.
     */
    module.Camera.prototype.setBestPositionForModel = function( aabb ) {
        //this.targetCenter = vec3.fromValues( aabb.center.x, aabb.center.y, aabb.center.z );
        var halfy = Math.max( Math.abs(aabb.max.y), Math.abs(aabb.min.y) );
        var halfx = Math.max( Math.abs(aabb.max.x), Math.abs(aabb.min.x) );
        var widthExtent = Math.max( halfy, halfx );
        //calculate for perspective
        this.targetRadius = 1.1 * widthExtent / Math.tan( 0.5 * this.verticalFOV );
    };

    module.Camera.prototype.rotation = function() {
        return mat3.multiply(
            mat3.create(),
            mat3FromAxisAngle( [0,0,1], this.azimuth ),
            mat3FromAxisAngle( [1,0,0], 0.5*Math.PI - this.polar )
        );
    };

    /*Returns {mat3} rotation matrix corresponding to the rotation
     * theta about the axis u.*/
    function mat3FromAxisAngle( u, theta ) {
        var r = mat3.create();
        r[0] = Math.cos(theta) + u[0]*u[0] * (1.0 - Math.cos(theta) );
        r[1] = u[0]*u[1] * (1.0 - Math.cos(theta)) - u[2]*Math.sin(theta);
        r[2] = u[0]*u[2] * (1.0 - Math.cos(theta)) + u[1]*Math.sin(theta);
        r[3] = u[1]*u[0] * (1.0 - Math.cos(theta)) + u[2]*Math.sin(theta);
        r[4] = Math.cos(theta) + u[1]*u[1]*(1.0 - Math.cos(theta));
        r[5] = u[1]*u[2] * (1.0 - Math.cos(theta)) - u[0]*Math.sin(theta);
        r[6] = u[2]*u[0] * (1.0 - Math.cos(theta)) - u[1]*Math.sin(theta);
        r[7] = u[2]*u[1] * (1.0 - Math.cos(theta)) + u[0]*Math.sin(theta);
        r[8] = Math.cos(theta) + u[2]*u[2] * (1.0 - Math.cos(theta));
        return r;
    }

    /**
     * @returns {vec3} the normalized vector pointing forward in the local coordinate system
     */
    module.Camera.prototype.forward = function() {
        var norm = vec3.normalize( vec3.create(), this.position );
        return vec3.fromValues( -norm[0], -norm[1], -norm[2] );
    };

    module.Camera.prototype.right = function() {
        var x = this.radius * Math.sin( this.polar ) * Math.cos( this.azimuth );
        var z = - this.radius * Math.sin( this.polar ) * Math.sin( this.azimuth );
        return vec3.normalize( vec3.create(), vec3.fromValues( x, 0.0, z ) );
    };

    module.Camera.prototype.up = function() {
        return vec3.cross( vec3.create(), this.right(), this.forward() );
    };

    module.Camera.prototype.positionLeft = function() {
        //this.rotation = 0.0;
        this.polar = Math.PI / 2.0;
        this.azimuth = Math.PI / 2.0;
    };

    module.Camera.prototype.positionRight = function() {
        //this.rotation = 0.0;
        this.polar = Math.PI / 2.0;
        this.azimuth = 3.0 * Math.PI / 2.0;
    };

    module.Camera.prototype.positionTop = function() {
        //this.rotation = 0.0;
        this.polar = 0.001;
        this.azimuth = 0.0;
    };

    module.Camera.prototype.positionBottom = function() {
        //this.rotation = 0.0;
        this.polar = Math.PI;
        this.azimuth = 0.0;
    };

    module.Camera.prototype.positionFront = function() {
        //this.rotation = 0.0;
        this.polar = Math.PI / 2.0;
        this.azimuth = 0.0;
    };

    module.Camera.prototype.positionBack = function() {
        //this.rotation = 0.0;
        this.polar = Math.PI / 2.0;
        this.azimuth = Math.PI;
    };

    /////////////////////////////////////////////////////////////////////////////////////////
    // Shader strings and attribute methods
    /////////////////////////////////////////////////////////////////////////////////////////

    module.color = {
        camera: mat4.create(),
        model: mat4.create(),
        colorMode: 1,
        enableAttributes: function( gl, program ) {
            gl.enableVertexAttribArray( program.attribute( "vert" ) );
            gl.enableVertexAttribArray( program.attribute( "curvature" ) );
            gl.enableVertexAttribArray( program.attribute( "orientation" ) );
        },
        setAttributes: function( gl, program, numVertices, mesh ) {
            gl.vertexAttribPointer( program.attribute( "vert" ),
                3, gl.FLOAT, false, 0, 0 );

            if ( mesh.has( "curvature" ) && mesh.has( "orientation" ) ) {
                gl.vertexAttribPointer( program.attribute( "curvature" ),
                    1, gl.FLOAT, gl.FALSE, 0, 36 * numVertices );
                gl.vertexAttribPointer( program.attribute( "orientation" ),
                    1, gl.FLOAT, gl.FALSE, 0, 40 * numVertices );
            }
        },
        setUniforms: function( program ) {
            program.setUniform( "camera", this.camera, { type: "mat4" } );
            program.setUniform( "model", this.model, { type: "mat4" } );
            program.setUniform( "colorMode", this.colorMode, { type: "int" } );
        },
        vertex:
            "precision mediump float;\n"+

            "attribute vec3 vert;\n" +
            "attribute float curvature;\n" +
            "attribute float orientation;\n" +

            "uniform mat4 model;\n" +
            "uniform mat4 camera;\n" +

            "uniform int colorMode;\n" +

            "varying vec4 fragColor;\n" +

            "vec4 yellowToRed( float scalar );\n" +
            "vec4 longRainbow( float scalar );\n" +
            "vec4 shortRainbow( float scalar );\n" +

            "void main() {\n" +
            "	if ( colorMode == 1 ) {	//dirichlet normal energy\n" +
            "       float scalar = ( exp(1.3*curvature) - 1.0 ) / ( exp(1.3) - 1.0 );\n" +
            "       \n" +
            "       \n" +
            "		fragColor = yellowToRed( scalar );\n" +
            "	} else if ( colorMode == 2 ) {	//orientation map\n" +
            "		fragColor = longRainbow( orientation );\n" +
            "	}\n" +
            "	gl_Position = camera * model * vec4( vert, 1.0 );\n" +
            "}\n" +

            "vec4 yellowToRed( float scalar ) {\n"+
                "vec4 color = vec4( 0.0, 0.0, 0.0, 1.0 );\n"+
                "color.r = 1.0;\n" +
                "color.g = 1.0 - scalar;\n" +
                "return color;\n" +
            "}\n" +

            "vec4 longRainbow( float scalar ) {\n" +
		"scalar = scalar/2; \n" +
                "vec3 color = vec3( 0.0, 0.0, 0.0 );\n" +
                "if ( scalar >= 0.0 && scalar < 0.1666 ) {\n" +
                "	color.g = scalar * 6.0;\n" +
                "	color.b = 1.0;\n" +
                "} else if ( scalar >= 0.1666 && scalar < 0.3333 ) {\n" +
                "	color.g = 1.0;\n" +
                "	color.b = 1.0 - 6.0 * (scalar - 0.1666);\n" +
                "} else if ( scalar >= 0.3333 && scalar < 0.5000 ) {\n" +
                "	color.r = 6.0 * (scalar - 0.3333);\n" +
                "	color.g = 1.0;\n" +
                "} else if ( scalar >= 0.5000 && scalar < 0.6666 ) {\n" +
                "	color.r = 1.0;\n" +
                "	color.g = 1.0 - 6.0 * (scalar - 0.5000);\n" +
                "} else if ( scalar >= 0.6666 && scalar < 0.8333 ) {\n" +
                "   color.b = 6.0*(scalar - 0.6666);\n"+
                "   color.r = 1.0;\n"+
                "} else if ( scalar >= 0.8333 && scalar <= 1.0 ) {\n" +
                "   color.b = 1.0;\n"+
                "   color.r = 1.0 - 6.0 * (scalar - 0.8333);\n"+
                "}\n"+
                "return vec4( color, 1.0 );\n" +
            "}\n" +

            "vec4 shortRainbow( float scalar ) {	//scalar must be normalized!\n" +
                "vec3 color = vec3( 0.0, 0.0, 0.0 );\n" +
                "if ( scalar >= 0.0 && scalar < 0.25 ) {\n" +
                "	color.g = scalar * 4.0;	//green varies linearly between [0,1]\n" +
                "	color.b = 1.0;			//blue is maxed out\n" +
                "} else if ( scalar >= 0.25 && scalar < 0.35 ) {\n" +
                "	color.g = 1.0;			//green is maxed out\n" +
                "	color.b = 1.0 - 10.0 * ( scalar - 0.25 );	//blue varies between [1,0]\n" +
                "} else if ( scalar >= 0.35 && scalar < 0.75 ) {\n" +
                "	color.r = ( scalar - 0.35 ) * 2.5;	//red varies between [0,1]\n" +
                "	color.g = 1.0;					//green is maxed out\n" +
                "} else if ( scalar >= 0.75 && scalar <= 1.0 ) {\n" +
                "	color.r = 1.0;	//red is maxed out\n" +
                "	color.g = 1.0 - 4.0 * ( scalar - 0.75 );	//green varies between [1,0]\n" +
                "}\n" +
                "return vec4( color, 1.0 );\n" +
            "}\n",
        fragment:
            "precision mediump float;\n" +
            "varying vec4 fragColor;\n" +

            "void main() {\n" +
            "	gl_FragColor = fragColor;\n" +
            "}\n"
    };

    module.wireframe = {
        camera: mat4.create(),
        model: mat4.create(),
        surfaceColor: vec3.fromValues( 0.6, 0.6, 0.6 ),

        enableAttributes: function( gl, program ) {
            gl.enableVertexAttribArray( program.attribute( "vert" ) );
            gl.enableVertexAttribArray( program.attribute( "barycentric" ) );
        },

        setAttributes: function( gl, program, numVertices ) {
            gl.vertexAttribPointer( program.attribute( "vert" ),
                3, gl.FLOAT, false, 0, 0 );
            gl.vertexAttribPointer( program.attribute( "barycentric" ),
                3, gl.FLOAT, false, 0, 12 * numVertices );
        },

        setUniforms: function( program ) {
            program.setUniform( "camera", this.camera, { type: "mat4" } );
            program.setUniform( "model", this.model, { type: "mat4" } );
            program.setUniform( "surfaceColor", this.surfaceColor, {type:"vec3"} );
        },
        vertex:
            "attribute vec3 vert;\n" +
            "attribute vec3 barycentric;\n"+

            "uniform mat4 camera;\n" +
            "uniform mat4 model;\n" +

            "varying mediump vec3 barycentricPos;\n" +

            "void main( void ) {\n" +
            "	barycentricPos = barycentric;\n" +
            "	gl_Position = camera * model * vec4( vert, 1.0 );\n" +
            "}",
        fragment:
            "uniform mediump vec3 surfaceColor;\n" +
            "varying mediump vec3 barycentricPos;\n" +

            "void main( void ) {\n" +
            "	if ( any( lessThan( barycentricPos, vec3( 0.02 ) ) ) ) {\n" +
            "		gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n" +
            "	} else {\n" +
            "		gl_FragColor = vec4( surfaceColor, 1.0 );\n" +
            "	}\n" +
            "}"
    };

    module.hemisphere = {
        camera: mat4.create(),
        model: mat4.create(),
        normalMatrix: mat4.create(),
        skyColor: vec3.fromValues( 0.830, 0.819, 0.819 ),
        groundColor: vec3.fromValues( 0.181, 0.161, 0.095 ),
        polar: 0,
        azimuth: 0,

        enableAttributes: function( gl, program ) {
            gl.enableVertexAttribArray( program.attribute( "vert" ) );
            gl.enableVertexAttribArray( program.attribute( "norm" ) );
        },

        setAttributes: function( gl, program, numVertices ) {
            gl.vertexAttribPointer( program.attribute( "vert" ),
                3, gl.FLOAT, false, 0, 0 );
            //before normal, there is barycentric
            gl.vertexAttribPointer( program.attribute( "norm" ),
                3, gl.FLOAT, false, 0, 12 * 2 * numVertices );
        },

        setUniforms: function( program ) {
            // calculate the light's position
            var lightVector = vec3.fromValues(
                Math.sin( this.polar ) * Math.sin( this.azimuth ),
                Math.cos( this.polar ),
                Math.sin( this.polar ) * Math.cos( this.azimuth )
            );
            program.setUniform( "lightPosition",
                lightVector,
                { type: "vec3"} );
            program.setUniform( "skyColor",
                this.skyColor, { type: "vec3" } );
            program.setUniform( "groundColor",
                this.groundColor, { type: "vec3" } );

            var normal = mat4.create();	//the normal matrix
            mat4.invert( normal, this.model );
            mat4.transpose( normal, normal );

            program.setUniform( "normalMatrix", normal, { type: "mat4" } );
            program.setUniform( "camera", this.camera, { type: "mat4" } );
            program.setUniform( "model", this.model, { type: "mat4" } );
        },
        vertex:
            "precision mediump float;\n" +

            "attribute vec3 vert;\n" +
            "attribute vec3 norm;\n" +

            "uniform mat4 camera;\n" +
            "uniform mat4 model;\n" +
            "uniform mat4 normalMatrix;\n" +

            "uniform vec3 lightPosition;\n" +
            "uniform vec3 skyColor;\n" +
            "uniform vec3 groundColor;\n" +

            "varying vec3 fragColor;\n" +

            "void main() {\n" +
            "	vec3 fragNormal = vec3( normalMatrix * vec4( norm, 0.0 ) );\n" +
            "	vec3 position = vec3( model * vec4( vert, 1.0 ) );\n" +
            "	vec3 lightVector = normalize( lightPosition - normalize( position ) );\n" +

            "	float theta = dot( fragNormal, lightVector );\n" +
            "	float a = theta * 0.5 + 0.5;\n" +
            "	fragColor = mix( groundColor, skyColor, a );\n" +
            "	gl_Position = camera * model * vec4( vert, 1.0 );\n" +
            "}",

        fragment:
            "precision mediump float;\n" +

            "varying vec3 fragColor;\n" +
            "void main() {\n" +
            "	gl_FragColor = vec4(fragColor, 1.0 );\n" +
            "}"
    };

    module.flatShader = {
        camera: mat4.create(),
        model: mat4.create(),
        surfaceColor: vec3.fromValues( 0.8, 0.8, 0.8 ),

        enableAttributes: function( gl, program ) {
            gl.enableVertexAttribArray( program.attribute( "vert" ) );
        },

        setAttributes: function( gl, program ) {
            gl.vertexAttribPointer( program.attribute( "vert" ),
                3, gl.FLOAT, false, 0, 0 );
        },

        setUniforms: function( program ) {
            program.setUniform( "camera", this.camera, { type: "mat4" } );
            program.setUniform( "model", this.model, { type: "mat4" } );
            program.setUniform( "surfaceColor", this.surfaceColor, {type:"vec3"} );
        },
        vertex:
            "attribute vec3 vert;\n" +

            "uniform mat4 camera;\n" +
            "uniform mat4 model;\n" +

            "void main( void ) {\n" +
            "	gl_Position = camera * model * vec4( vert, 1.0 );\n" +
            "}",
        fragment:
            "uniform mediump vec3 surfaceColor;\n" +

            "void main( void ) {\n" +
            "	gl_FragColor = vec4( surfaceColor, 1.0 );\n" +
            "}"
    };

    return module;
}( morphoviewer || {} ) );

