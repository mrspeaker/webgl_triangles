var dom = document.querySelector("#board"),
	c = dom.getContext("webgl") || dom.getContext("experimental-webgl"),
	transitioning = 0;

function onResize () {
	dom.width = window.innerWidth;
	dom.height = window.innerHeight;
	c.viewport(0, 0, dom.width, dom.height);
}
onResize();
window.addEventListener("resize", onResize, false);

function morphPoints () {
	randomisePoints(points2);
	transitioning = 500;
}
window.addEventListener("mousedown", morphPoints, false);
setInterval(morphPoints, 6000);

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
/*var z = -12;
points = new Float32Array([
		-1.0, -1.0, z, 
		1.0, -1.0, z,
		-1.0, 1.0, z,
		1.0, -1.0, z + 2, 
		1.0, 1.0, z + 2,  
		-1.0, 1.0, z + 2
	])
*/
function randomisePoints(points) {
	for (var i = 0; i < points.length; i += 3) {
		points[i] = Math.random() * 2 - 2;
		points[i+1] = Math.random() * 2 - 1;
		points[i+2] = 0 - (Math.random() * 11 + 2)
	}
}
randomisePoints(points);

// RESET STUFF
c.clearColor(0.1, 0.1, 0.1, 1.0);
c.clearDepth(1.0);
c.enable(c.DEPTH_TEST);
c.depthFunc(c.LEQUAL);
c.clear(c.COLOR_BUFFER_BIT | c.DEPTH_BUFFER_BIT);

var vertexPositionAttribute,
	startTime = Date.now() - (Math.random() * (1000 * 60) | 0),
	now = 0,
	multMatrix = function (m) {
  		mvMatrix = mvMatrix.x(m);
	},
	mvTranslate = function (v) {
  		multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
	};
	
// Only need to bind when geom changes.
c.bindBuffer(c.ARRAY_BUFFER, buffer);
c.bufferData(c.ARRAY_BUFFER, points, c.STATIC_DRAW);

// Only one program, so set it out here.
c.useProgram(program);
c.vertexAttribPointer(vertexPositionAttribute, 3, c.FLOAT, false, 0, 0);

// Camera & project matrices
var pMatrix = makePerspective(45, 640.0 / 480.0, 0.1, 100.0),
	mvMatrix = Matrix.I(4),
	pUniform = c.getUniformLocation(program, "projection"),
	mvUniform = c.getUniformLocation(program, "mvMatrix");

c.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));
	
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

	// Why enable/disable pos attrib? Still works if set once.
	c.enableVertexAttribArray(vertexPositionAttribute);
	c.drawArrays(c.TRIANGLES, 0, points.length / 3);
	c.disableVertexAttribArray(vertexPositionAttribute);

	requestAnimationFrame(loop);
};
loop();
