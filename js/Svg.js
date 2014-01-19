/*
 * This file is part of the Doodle3D project (http://doodle3d.com).
 *
 * Copyright (c) 2013, Doodle3D
 * This software is licensed under the terms of the GNU GPL v2 or later.
 * See file LICENSE.txt or visit http://www.gnu.org/licenses/gpl.html for full license details.
 */

//SVG validator: http://validator.w3.org/
//SVG viewer: http://svg-edit.googlecode.com/svn/branches/2.6/editor/svg-editor.html
function saveToSvg() {
	var lastX = 0, lastY = 0, lastIsMove = false;
	var svg = '';

	var boundsWidth = doodleBounds[2] - doodleBounds[0];
	var boundsHeight = doodleBounds[3] - doodleBounds[1];

	svg += '<?xml version="1.0" standalone="no"?>\n';
	svg += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
	svg += '<svg width="' + boundsWidth + '" height="' + boundsHeight + '" version="1.1" xmlns="http://www.w3.org/2000/svg">\n';
	svg += '\t<desc>Doodle 3D sketch</desc>\n';

	var data = '';
	for (var i = 0; i < _points.length; ++i) {
		var x = _points[i][0], y = _points[i][1], isMove = _points[i][2];
		var dx = x - lastX, dy = y - lastY;

		if (i == 0)
			data += 'M'; //emit absolute move on first pair of coordinates
		else if (isMove != lastIsMove)
			data += isMove ? 'm' : 'l';

		data += dx + ',' + dy + ' ';

		lastX = x;
		lastY = y;
		lastIsMove = isMove;
	}

	svg += '\t<path transform="translate(' + -doodleBounds[0] + ',' + -doodleBounds[1] + ')" d="' + data + '" fill="none" stroke="black" stroke-width="2" />\n';

	var fields = JSON.stringify({'height': numLayers, 'outlineShape': VERTICALSHAPE, 'twist': rStep});
	svg += '\t<!--<![CDATA[d3d-keys ' + fields + ']]>-->\n';

	svg += '</svg>\n';

	return svg;
}


//TODO: use local variables instead of _points,numLayers,VERTICALSHAPE and rStep so we can leave a current doodle in tact if an error occurs while parsing
function loadFromSvg(svgData) {
	var mode = '', x = 0, y = 0;

	console.log("loading " + svgData.length + " bytes of data...");

	clearDoodle();

	var p = svgData.indexOf("<path");
	if (p == -1) { console.log("loadFromSvg: could not find parsing start point"); return false; }
	p = svgData.indexOf('d="', p);
	if (p == -1) { console.log("loadFromSvg: could not find parsing start point"); return false; }
	p += 3; //skip 'd="'

	var skipSpace = function() { while (svgData.charAt(p) == ' ') p++; }
	var parseCommand = function() {
		while (true) {
			skipSpace();
			var c = svgData.charAt(p);
			if (c == 'M' || c == 'm' || c == 'L' || c == 'l') { //new command letter
				mode = c;
			} else if (c == '"') { //end of command chain
				return true;
			} else { //something else, must be a pair of coordinates...
				var tx = 0, ty = 0, numberEnd = 0, len = 0;
				numberEnd = svgData.indexOf(',', p);
				if (numberEnd == -1) { console.log("could not find comma in coordinate pair"); return false; }
				len = numberEnd - p;
				tx = parseFloat(svgData.substr(p, len));
				p += len + 1;
				skipSpace();
				numberEnd = svgData.indexOf(' ', p);
				if (numberEnd == -1) { console.log("could not find space after coordinate pair"); return false; }
				len = numberEnd - p;
				ty = parseFloat(svgData.substr(p, len));
				p += len;

				if (mode == 'M' || mode == 'L') {
					x = tx; y = ty;
				} else if (mode == 'm' || mode == 'l') {
					x += tx; y += ty;
				} else {
					console.log("loadFromSvg: found coordinate pair but mode was never set");
					return false;
				}

				var isMove = mode == 'm' || mode == 'M';

				//TODO: create script-wide function for adding points?
				//console.log("inserting "+x+","+y+" ",isMove);
				updatePrevX = x;
				updatePrevY = y;
				_points.push([x, y, isMove]);
				adjustBounds(x, y);
				adjustPreviewTransformation();

				if (isMove) draw(x, y, .5);
				else draw(x, y);
			}
			p++;
		}

		return true;
	};

	parseCommand(); //depends on value of p, so don't move this without taking that into consideration

	const fieldDefMarker = "<!--<![CDATA[d3d-keys";
	p = svgData.indexOf(fieldDefMarker);
	if (p == -1) { console.log("loadFromSvg: could not find metadata marker"); return false; }
	p += fieldDefMarker.length;
	skipSpace();

	var endP = svgData.indexOf("]]>-->", p);
	if (endP == -1) { console.log("loadFromSvg: could not find metadata end-marker"); return false; }
	var metaFields = JSON.parse(svgData.substr(p, endP - p));
	//TODO: log error and return false if parsing failed
	for (var k in metaFields) {
		var v = metaFields[k];
		switch (k) {
		case "height": numLayers = v; break;
		case "outlineShape": VERTICALSHAPE = v; break;
		case "twist": rStep = v; break;
		}
	}

	renderToImageDataPreview();

	return true;
}
