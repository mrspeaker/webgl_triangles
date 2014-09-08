var dom = document.querySelector("#board"),
	c = dom.getContext("webgl") || dom.getContext("experimental-webgl"),
	transitioning = 0;

// Handle screen resize
function onResize () {
	dom.width = window.innerWidth;
	dom.height = window.innerHeight;
	c.viewport(0, 0, dom.width, dom.height);
}
onResize();
window.addEventListener("resize", onResize, false);

// Add timer to morph the points (or onclick)
function morphPoints () {
	randomisePoints(points2);
	transitioning = 500;
}
window.addEventListener("mousedown", morphPoints, false);
setInterval(morphPoints, 6000);

// Grab the shaders
var vs_text = document.querySelector("#vertex-shader").textContent,
	fs_text = document.querySelector("#fragment-shader").textContent;

// VERTEX SHADER
var v_shader = c.createShader(c.VERTEX_SHADER);
c.shaderSource(v_shader, vs_text);
c.compileShader(v_shader);
if (!c.getShaderParameter(v_shader, c.COMPILE_STATUS)) {
	console.error("error compiling vs shader:", c.getShaderInfoLog(v_shader));
	c.deleteShader(v_shader);
}

// FRAGMENT SHADER
var f_shader = c.createShader(c.FRAGMENT_SHADER);
c.shaderSource(f_shader, fs_text);
c.compileShader(f_shader);
if (!c.getShaderParameter(f_shader, c.COMPILE_STATUS)) {
	console.error("error compiling fs shader", c.getShaderInfoLog(f_shader));
	c.deleteShader(f_shader);
}

// PROGRAM
var program = c.createProgram();
c.attachShader(program, v_shader);
c.attachShader(program, f_shader);
c.deleteShader(v_shader);
c.deleteShader(f_shader);
c.linkProgram(program);
if (!c.getProgramParameter(program, c.LINK_STATUS)) {
	console.error("error linking program", c.getProgramParameter(program, c.VALIDATE_STATUS), c.getError());
}

// SET UP GEOMETRY
var buffer = c.createBuffer(),
	points = new Float32Array(Math.pow(3, 7)),
	points2 = new Float32Array(points.length);
	randomisePoints = function (points) {
		var ts = 0;
		for (var i = 0; i < points.length; i += 3) {
			var rs = randSphere();
			points[i] = rs.x;
			points[i + 1] = rs.y;
			points[i + 2] = rs.z - 6;
			
			// points[i] = Math.random() * 2 - 2;
			// points[i+1] = Math.random() * 2 - 1;
			// points[i+2] = 0 - (Math.random() * 11 + 2)
		}
	};
randomisePoints(points);

function randSphere() {
	var x, y z, k = 0;
	while (k < 0.2 || k > 0.3) {
		x = Math.random() - 0.5;
		y = Math.random() - 0.5;
		z = Math.random() - 0.5;
		k = Math.sqrt(x * x + y * y + z * z);
	}
	return { 
		x: x / k, 
		y: y / k, 
		z: z / k 
	};
}

// RESET STUFF
//c.clearColor(0.1, 0.1, 0.1, 1.0);
//c.clearDepth(1.0);
c.enable(c.DEPTH_TEST);
c.depthFunc(c.LEQUAL);
c.clear(c.COLOR_BUFFER_BIT | c.DEPTH_BUFFER_BIT);

// Some helpers for the main loop
var vertexPositionAttribute,
	startTime = Date.now() - (Math.random() * (1000 * 60) | 0),
	now = 0,
	multMatrix = function (m) {
  		mvMatrix = mvMatrix.x(m);
	},
	mvTranslate = function (v) {
  		multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])));
	};
	
// Only need to bind when geom changes.
c.bindBuffer(c.ARRAY_BUFFER, buffer);
c.bufferData(c.ARRAY_BUFFER, points, c.STATIC_DRAW);

// Only one program, so set it out here.
c.useProgram(program);

// Camera & project matrices
var pMatrix = glUtils.makePerspective(45, 640.0 / 480.0, 0.1, 100.0),
	mvMatrix = Matrix.I(4),
	pUniform = c.getUniformLocation(program, "projection"),
	mvUniform = c.getUniformLocation(program, "mvMatrix");

c.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));

var texture = c.createTexture(),
	texCoordAttribute,
	image = document.getElementById("tex");
c.bindTexture(c.TEXTURE_2D, texture);

// Set the parameters so we can render any size image.
//c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_S, c.CLAMP_TO_EDGE);
//c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_T, c.CLAMP_TO_EDGE);
c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.NEAREST);
c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.NEAREST);

// Upload the image into the texture.
c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, c.RGBA, c.UNSIGNED_BYTE, image);

// RENDER
function loop () {
	// Set Time
	now = Date.now() - startTime;
	c.uniform1f(c.getUniformLocation(program, "time"), now / 1000);

	// Move camera
	mvMatrix = Matrix.I(4);
	mvTranslate([
		(Math.sin(now / 8000) * 2) * 0.8 + 0.8, 
		Math.cos(now/5000) * 0.8, 
		0.5 + Math.sin(now/5000) * -2
	]);
  	c.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

  	// Do morphing
  	if (transitioning-- > 0) {
  		for (var i = 0; i < points.length; i++) {
  			var a = points[i],
  				b = points2[i];
  			if (a < b) { a += 0.01; }
  			if (a > b) { a -= 0.01; }

			points[i] = a;
  		}
  		c.bindBuffer(c.ARRAY_BUFFER, buffer);
		c.bufferData(c.ARRAY_BUFFER, points, c.STATIC_DRAW);
  	}

	texCoordAttribute = c.getAttribLocation(program, "aTexCoord");
	c.vertexAttribPointer(texCoordAttribute, 2, c.FLOAT, false, 0, 0);
	c.enableVertexAttribArray(texCoordAttribute);

	c.vertexAttribPointer(vertexPositionAttribute, 3, c.FLOAT, false, 0, 0);
	c.enableVertexAttribArray(vertexPositionAttribute);
	c.drawArrays(c.TRIANGLES, 0, points.length / 3);
	
	c.disableVertexAttribArray(texCoordAttribute);
	c.disableVertexAttribArray(vertexPositionAttribute);

	requestAnimationFrame(loop);
};
loop();
