var links = [];
var nodes = {};
var menuDisplayed = false;
var menuBox = null;
var selectedNode = null;

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

//extract hostname
function extractHostname(url) {
    var hostname;
    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];
    return hostname;
}

//extract domain
function extractRootDomain(url) {
    var domain = extractHostname(url);
    var splitArr = domain.split('.');
    var arrLen = splitArr.length;

    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        if (splitArr[arrLen - 1].length === 2 && splitArr[arrLen - 1].length === 2) {
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}


function checkIntersection(list1,list2){
    for(var i = 0;i<list1.length;i++){
        for(var j = 0;j<list2.length;j++){
            if(list1[i]===list2[j]){
                return true;
            }
        }
    }
    return false;
}

function getPaths(he1,he2) {
    var url1 = {"url": he1.elem.url};
    var url2 = {"url": he2.elem.url};
    if(!(url1.url == url2.url)){
        chrome.history.getVisits(url1, function (stPage) {
            var firstArray = [];
            for (var i = 0; i < stPage.length; i++) {
                if (!(stPage[i].visitId === "0")) {
                    firstArray.push(stPage[i].visitId);
                }
            }

            chrome.history.getVisits(url2, function (ndPage) {
                var secondArray = [];
                for (var j = 0; j < ndPage.length; j++) {
                    if (!(ndPage[j].referringVisitId === "0")) {
                        secondArray.push(ndPage[j].referringVisitId);
                    }
                }

                if (checkIntersection(firstArray, secondArray)) {
                    links.push({"source": he1.elem.url, "target": he2.elem.url, "type": "arrow","s_title": he1.elem.title,"t_title": he2.elem.title});
                }

            });

        });
    }
}

function limitSearchesForArrow(list,element,start){
    for (var j = list.length-1;j > start; j--){
        getPaths(list[j],element);
    }
    links.push({"source": element.elem.url, "target": element.elem.url, "type": "none", "s_title": element.elem.title,"t_title": element.elem.title});
}


function triggerHistoryRepresentation() {
    chrome.history.search({text: '', maxResults: 30}, function (data) {
        urls = [];
        links = [];
        data.forEach(function (page) {
            var historyElement = {};
            historyElement.elem = page;
            urls.push(historyElement);
        });
        for (var i = 0; i < urls.length; i++) {
            limitSearchesForArrow(urls, urls[i], 0);
        }

    });
}

//main function to generate a graph
function generateHistoryGraph(relink) {
    if(relink){
        links.forEach(function (link) {
            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, title: link.s_title});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, title: link.t_title});
        });
    }
    var width = 960;
    var height = 500;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(100)
        .charge(-300)
        .on("tick", tick)
        .start();

    var svg = d3.select(".GraphContainer").append("svg")
        .attr("id","my_svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox","0 0 960 500")
        .attr("preserveAspectRatio","xMidYMid meet");

    svg.append("defs").selectAll("marker")
        .data(["arrow"])
        .enter().append("marker")
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 30)
        .attr("refY", -3.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");

    var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) {
            return "link " + d.type;
        })
        .attr("marker-end", function (d) {
            return "url(#" + d.type + ")";
        });

    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", 20)
        .call(force.drag);

    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 0)
        .attr("y", ".3em")
        .attr("text-anchor","middle")
        .attr("alignment-baseline","middle")
        .text(function (d) {
            return extractRootDomain(d.name);
        });

    //add styles to nodes
    text.attr("style", "text-shadow:0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff; font:10px sans-serif;");
    circle.attr("style","fill:#cc4b45; stroke:#333; stroke-width:1.5px;");
    path.attr("style","fill:none; stroke:#666; stroke-width:1.5px;");
    //add metadata to circles

    circle.append("title")
        .text(function(d) { return d.title; });

    circle.append("desc")
        .text(function(d) { return d.name; });

    //add context menu on circle nodes
    circle.on("contextmenu",function(){
        d3.event.preventDefault();
        var left = d3.event.clientX;
        var top = d3.event.clientY;
        menuBox = window.document.querySelector(".menu");
        menuBox.style.left = left + "px";
        menuBox.style.top = top + "px";
        menuBox.style.display = "block";
        menuDisplayed = true;
        selectedNode = d3.event.target.childNodes[1].textContent;

    });

    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
}

//listeners for context menu
document.getElementById("menu").addEventListener("click",function(e){
    if(e.target.dataset.action == "goto") {
        var win = window.open(selectedNode, '_blank');
        win.focus();
    } else if(e.target.dataset.action == "delete") {
        //delete action
        delete nodes[selectedNode];
        links = links.filter(function(l) {
            return l.source.name != selectedNode && l.target.name != selectedNode;
        });
        //delete async history entry via chrome API
        chrome.history.deleteUrl({url : selectedNode}, function(e){});
        var s = d3.selectAll('svg');
        s.selectAll("*").remove();
        s = s.remove();
        generateHistoryGraph(false);

    }
});
window.addEventListener("click", function(){
    if(menuDisplayed == true){
        menuBox.style.display = "none";
    }
}, true);
//done

//listeners for data download
document.getElementById("dsvg").addEventListener("click", function(){
    writeToFileSVG();
});
document.getElementById("dpng").addEventListener("click", function(){
    writeToFilePNG();
});
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
        document.querySelector('#png-container').innerHTML = '<img src="'+png+'"/>';
        DOMURL.revokeObjectURL(png);
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


triggerHistoryRepresentation();
setTimeout(function(){ generateHistoryGraph(true) }, 2000);







