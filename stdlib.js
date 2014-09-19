
function ltrim(str) { 
	for(var k = 0; k < str.length && isWhitespace(str.charAt(k)); k++);
	return str.substring(k, str.length);
}

function rtrim(str) {
	for(var j=str.length-1; j>=0 && isWhitespace(str.charAt(j)) ; j--) ;
	return str.substring(0,j+1);
}

function trim(str) {
	return ltrim(rtrim(str));
}

function isDefined(x) {
	return typeof x != 'undefined';
}

function isWhitespace(charToCheck) {
	var whitespaceChars = " \t\n\r\f";
	return (whitespaceChars.indexOf(charToCheck) != -1);
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function isInt(n) {
	return isNumber(n) && n == (n|0);
}

function isAddress(n) {
	return isInt(n) && n >= 0;
}

function isFunction(o) {
	return typeof(o) == 'function' && (!Function.prototype.call || typeof(o.call) == 'function')
}

function isString(s) {
	return Object.prototype.toString.call(s) == '[object String]'
}

function tokenize(terminator, untokenised_text) {
// replaces newlines with the terminator, so watch it

	if(untokenised_text == "" || terminator == "") return "";

	var token = ""; 

	var token_fragment; 
	var bits;
	var trim_length;
	
	// can't tokenise non existent text
	while(untokenised_text != undefined) {
	
		// split at the terminator
		bits = untokenised_text.replace("\n", terminator).split(terminator, 2);
		
		// contains the token we want
		token_fragment = bits[0];
		
		// amount of text we will trim from the front of the untokenized_text
		trim_length = token_fragment.length + terminator.length;

		// trim multiple terminators (e.g. lots of spaces) by extending the trim length
		while(untokenised_text.substr(trim_length, terminator.length) == terminator)
			trim_length += terminator.length;
		
		if(terminator == '"') { // double quote special case looking for escaped \" and \\
			if(token_fragment.substr(-1) == "\\") {
				token = token.concat(token_fragment.substr(0, token_fragment.length-1))
				token = token.concat("\"");
				untokenised_text = untokenised_text.substr(trim_length - 1);
			} else {	
				token = token.concat(token_fragment);
				untokenised_text = untokenised_text.substr(trim_length);
				break;
			}
		} else {
			token = token_fragment;
			untokenised_text = untokenised_text.substr(trim_length);
			break;
		}
	}
	
	// tidy up untokenised text
	if(untokenised_text == undefined) 
		untokenised_text = "";
	else {
		// not sure if this is too specific, maybe we want to preserve spaces in some cases ?
		untokenised_text = ltrim(untokenised_text);
	}
	return Array(token, untokenised_text);
}

function println(e, t, style) {
	if(style == undefined)
		style = {};
	e.appendChild(elem('p', {}, style,  t))
}

function strstr(t, n) {
	var s = ""
	for(var i = 0; i < n; i++)
		s = s.concat(t)
	return s	
}

function insertAfter(parent_node, new_node, previous_sibling) {
	if(previous_sibling.nextSibling)
		parent_node.insertBefore(new_node, previous_sibling.nextSibling);
	else
		parent_node.appendChild(new_node);
	parent_node.innerHTML =  '' + parent_node.innerHTML; // makes it work in IE !
}

function kill_all_children(e) {
	while(e.firstChild) {
		e.removeChild(e.firstChild)
	}
}

function copy_ih(target, source) {
	if(target && source) {
		target.innerHTML= source.innerHTML;
		return true;
	}
	return false;
}

function elem(name, attrs, style, text) {
    var e = document.createElement(name);
    if (attrs) {
        for (key in attrs) {
            if (key == 'class') {
                e.className = attrs[key];
            } else if (key == 'id') {
                e.id = attrs[key];
            } else {
                e.setAttribute(key, attrs[key]);
            }
        }
    }
    if (style) {
        for (key in style) {
            e.style[key] = style[key];
        }
    }
    if (text) {
        e.appendChild(document.createTextNode(text));
    }
    return e;
}

function http_request(url) {
	if (typeof XMLHttpRequest === "undefined")
		XMLHttpRequest = function () {
			try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {};
			try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e) {};
    		try { return new ActiveXObject("Microsoft.XMLHTTP"); }  catch (e) {};
    		throw new Error("This browser does not support XMLHttpRequest.");
  		};
	
	var x = new XMLHttpRequest();
	
	x.open('GET', url, false);
	x.send()
	return x
}