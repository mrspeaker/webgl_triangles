(function (Matrix) {

    "use strict";

    // Augment Sylvester
    Matrix.Translation = function (v) {
        var r;

        if (v.elements.length === 2) {
            r = Matrix.I(3),
            r.elements[2][0] = v.elements[0];
            r.elements[2][1] = v.elements[1];
            return r;
        }

        if (v.elements.length === 3) {
            r = Matrix.I(4);
            r.elements[0][3] = v.elements[0];
            r.elements[1][3] = v.elements[1];
            r.elements[2][3] = v.elements[2];
            return r;
        }

        throw "Invalid length for Translation";
    }

    Matrix.prototype.flatten = function () {
        var el = this.elements,
            rl = el.length,
            cl = el[0].length,
            j, i,
            res = [];
        for (j = 0; j < rl; j++) {
            for (i = 0; i < cl; i++){
                res.push(el[i][j]);
            }
        }
        return res;
    }

}(Matrix));

(function () {

    "use strict";

    var glUtils = {
        //
        // gluLookAt
        //
        makeLookAt: function (ex, ey, ez, cx, cy, cz, ux, uy, uz) {
            var eye = $V([ex, ey, ez]),
                center = $V([cx, cy, cz]),
                up = $V([ux, uy, uz]);

            var z = eye.subtract(center).toUnitVector(),
                x = up.cross(z).toUnitVector(),
                y = z.cross(x).toUnitVector();

            var m = $M([
                    [x.e(1), x.e(2), x.e(3), 0],
                    [y.e(1), y.e(2), y.e(3), 0],
                    [z.e(1), z.e(2), z.e(3), 0],
                    [0, 0, 0, 1]
                ]);

            var t = $M([
                    [1, 0, 0, -ex],
                    [0, 1, 0, -ey],
                    [0, 0, 1, -ez],
                    [0, 0, 0, 1]
                ]);

            return m.x(t);
        },

        //
        // gluPerspective
        //
        makePerspective: function (fovy, aspect, znear, zfar) {
            var ymax = znear * Math.tan(fovy * Math.PI / 360.0),
                ymin = -ymax,
                xmin = ymin * aspect,
                xmax = ymax * aspect;

            return this.makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
        },

        //
        // glFrustum
        //
        makeFrustum: function (left, right, bottom, top, znear, zfar) {
            var X = 2 * znear / (right - left),
                Y = 2 * znear / (top - bottom),
                A = (right + left) / (right - left),
                B = (top + bottom) / (top - bottom),
                C = -(zfar + znear) / (zfar - znear),
                D = -2 * zfar * znear / (zfar - znear);

            return $M([
                    [X, 0, A, 0],
                    [0, Y, B, 0],
                    [0, 0, C, D],
                    [0, 0, -1, 0]
                ]);
        },

        //
        // glOrtho
        //
        makeOrtho: function (left, right, bottom, top, znear, zfar) {
            var tx = - (right + left) / (right - left),
                ty = - (top + bottom) / (top - bottom),
                tz = - (zfar + znear) / (zfar - znear);

            return $M([
                    [2 / (right - left), 0, 0, tx],
                    [0, 2 / (top - bottom), 0, ty],
                    [0, 0, -2 / (zfar - znear), tz],
                    [0, 0, 0, 1]
                ]);
        }

    }

    window.glUtils = glUtils;

}());
