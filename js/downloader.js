//dummy nodes = download tools
var imagediv = document.createElement("div");
imagediv.setAttribute("id","png-container");
imagediv.setAttribute("style","display:none");

var cvs = document.createElement("canvas");
cvs.setAttribute("width","960");
cvs.setAttribute("height","500");
cvs.setAttribute("style","display:none");

document.getElementsByTagName("body")[0].appendChild(cvs);
document.getElementsByTagName("body")[0].appendChild(imagediv);
//done

//main download functions
function writeToFileSVG(){
    var svg = document.getElementById("my_svg");
    var svg_data = (new XMLSerializer).serializeToString(svg);
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(svg_data));
    element.setAttribute('download', "example.svg");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


function writeToFilePNG(){
    var svgString = new XMLSerializer().serializeToString(document.querySelector('svg'));
    var canvas = document.getElementsByTagName("canvas")[0];
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,960,500);
    var DOMURL = self.URL || self.webkitURL || self;
    var img = new Image();
    var svg = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
    var url = DOMURL.createObjectURL(svg);
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        var png = canvas.toDataURL("image/png");
        var element = document.createElement('a');
        element.setAttribute('href', png);
        element.setAttribute('download', "example.png");
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    img.src = url;
}
//done

//listeners for data download
document.getElementById("dsvg").addEventListener("click", function(){
    var svg_container = document.getElementById("my_svg");
    if(svg_container != null){
        writeToFileSVG();
    }
});
document.getElementById("dpng").addEventListener("click", function(){
    var svg_container = document.getElementById("my_svg");
    if(svg_container != null){
        writeToFilePNG();
    }
});
//done