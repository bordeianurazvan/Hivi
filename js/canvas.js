var links = [];
var nodes = {};
var menuDisplayed = false;
var menuBox = null;
var selectedNode = null;
var selectedId = null;

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

//settings
var source = localStorage["hivi_data_source"];
var results = parseInt(localStorage["hivi_max_entries"]);
var blackList = JSON.parse(localStorage["hivi_blacklist_items"]).items;
//done

function isBlackListed(list,item){
    for(var i = 0; i < list.length; i++) {
        if(item == list[i]){
            return true;
        }
    }
    return false;
}
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

//HISTORY - START
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


function triggerHistoryRepresentation(startDate,endDate,max_entries,blacklist) {
    chrome.history.search({text: '', maxResults: max_entries, startTime:startDate, endTime:endDate}, function (data) {
        urls = [];
        links = [];
        nodes ={};
        data.forEach(function (page) {
            if(!isBlackListed(blacklist,page.url)){
                var historyElement = {};
                historyElement.elem = page;
                urls.push(historyElement);
            }
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
    var height = 450;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(100)
        .charge(-200)
        .on("tick", tick)
        .start();

    var svg = d3.select(".GraphContainer").append("svg")
        .attr("id","my_svg")
        .attr("viewBox","0 0 960 450")
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
        circle.attr("cx", function(d) { return d.x = Math.max(20, Math.min(width - 20, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(20, Math.min(height - 20, d.y)); });
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


//listeners for context menu
function historyMenu(){
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
}

//fully implemented history display
function displayHistory(){
    //apply listener
    historyMenu();
    //working with date interval
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    var startDate =  "" + yyyy + "-" + mm + "-" + dd;
    var endDate = "" + yyyy + "-" + mm + "-" + dd;
    document.getElementById("start").value = startDate;
    document.getElementById("end").value = endDate;
    var start = (new Date(startDate)).setHours(0,0,0,0);
    var end = (new Date(endDate)).setHours(23,59,59,999);
    //end
    triggerHistoryRepresentation(start,end,results,blackList);
    setTimeout(function(){ generateHistoryGraph(true) }, 1000);
    document.getElementById("start").addEventListener("change",function(e){
        start = (new Date(e.srcElement.value)).setHours(0,0,0,0);
        var s = d3.selectAll('svg');
        s.selectAll("*").remove();
        s = s.remove();
        triggerHistoryRepresentation(start,end,results,blackList);
        setTimeout(function(){ generateHistoryGraph(true) }, 2000);
    });
    document.getElementById("end").addEventListener("change",function(e){
        end = (new Date(e.srcElement.value)).setHours(23,59,59,999);
        var s = d3.selectAll('svg');
        s.selectAll("*").remove();
        s = s.remove();
        triggerHistoryRepresentation(start,end,results,blackList);
        setTimeout(function(){ generateHistoryGraph(true) }, 2000);
    })
}
//HISTORY - END

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



//BOOKMARKS - START

var links_backup = [];
function generateLinksFromBookmarks(node){
    if(node.hasOwnProperty("children")){
        for(var i = 0; i <node.children.length; i++){
            links_backup.push(
                {source : node.url || node.title,
                    target : node.children[i].url || node.children[i].title,
                    type : "arrow",
                    s_title : node.title || "no title",
                    t_title : node.children[i].title || "no title",
                    id : node.children[i].id,
                    parentId : node.children[i].parentId
                });
            generateLinksFromBookmarks(node.children[i]);
        }
    }

    //add itself to representation
    links_backup.push(
        {source : node.url || node.title,
            target : node.url ||node.title,
            type : "none",
            s_title : node.title,
            t_title : node.title,
            id : node.id,
            parentId : node.parentId
        });
}
function startingRepresentation(){
    for(var i = 0; i < links_backup.length; i++){
        if (links_backup[i].parentId == 0){
            links.push(JSON.parse(JSON.stringify(links_backup[i])));
        }
    }
}
function addChildrenByParentId(pid){
    for(var i = 0 ; i < links_backup.length; i++ ){
        if(links_backup[i].parentId == pid){
            links.push(JSON.parse(JSON.stringify(links_backup[i])));
        }
    }
}
function hasChildren(id){
    for(var i = 0; i < links_backup.length; i++){
        if(links_backup[i].parentId == id){
            return true;
        }
    }
    return false;
}
function removeChildrenByParentId(id){
    for(var i = 0;i < links.length; i++){
        var pid = links[i].parentId;
        var cid = links[i].id;
        if(id == pid){
            delete nodes[links[i].target.name];
            links.splice(i,1);
            i--;
            removeChildrenByParentId(cid);
        }
    }
}
function triggerBookmarksRepresentation(){
    links = [];
    links_backup = [];
    nodes ={};
    chrome.bookmarks.getTree(function(data){
        for(var i = 0; i < data[0].children.length; i++){
            generateLinksFromBookmarks(data[0].children[i]);
        }

    });
}
function linksStateReset(list){
    var new_list = [];
    for(var i = 0; i < list.length; i++){

        var item = {source : list[i].source.name || list[i].s_title,
            target : list[i].target.name || list[i].t_title,
            type : list[i].type,
            s_title : list[i].s_title,
            t_title : list[i].t_title,
            id : list[i].id,
            parentId : list[i].parentId
        };

        new_list.push(item);
    }
    return new_list;
}
function generateBookmarksGraph(relink) {
    if(relink){
        links.forEach(function (link) {
            link.source = nodes[link.source] || (nodes[link.source] =
                {name: link.source, title: link.s_title, id: link.id, parentId: link.parentId,
                    folder:(link.source == extractHostname(link.source)? 1 : 0), expanded:0});
            link.target = nodes[link.target] || (nodes[link.target] =
                {name: link.target, title: link.t_title, id: link.id, parentId: link.parentId,
                    folder:(link.target == extractHostname(link.target)? 1 : 0), expanded:0 });
        });
    }
    var width = 960;
    var height = 450;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(100)
        .charge(-200)
        .on("tick", tick)
        .start();

    var svg = d3.select(".GraphContainer").append("svg")
        .attr("id","my_svg")
        .attr("viewBox","0 0 960 450")
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
    circle.on("contextmenu",function(d){
        d3.event.preventDefault();
        var left = d3.event.clientX;
        var top = d3.event.clientY;
        menuBox = window.document.querySelector(".menu");
        menuBox.style.left = left + "px";
        menuBox.style.top = top + "px";
        menuBox.style.display = "block";
        menuDisplayed = true;
        selectedNode = d3.event.target.childNodes[1].textContent;
        selectedId = d.id;

    });
    circle.on("click",function(d){
        //d3.event.preventDefault();
        if(hasChildren(d.id)) {
            if(d.expanded == 0){
                d.expanded = 1;
                var s = d3.selectAll('svg');
                s.selectAll("*").remove();
                s = s.remove();
                links = linksStateReset(links);
                addChildrenByParentId(d.id);
                generateBookmarksGraph(true);

            } else {
                d.expanded = 0;
                var s = d3.selectAll('svg');
                s.selectAll("*").remove();
                s = s.remove();

                removeChildrenByParentId(d.id);
                generateBookmarksGraph(false);
            }
        }

    });

    function tick() {
        path.attr("d", linkArc);
        circle.attr("cx", function(d) { return d.x = Math.max(20, Math.min(width - 20, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(20, Math.min(height - 20, d.y)); });
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
function bookmarksMenu(){
    document.getElementById("menu").addEventListener("click",function(e){
        if(e.target.dataset.action == "goto") {
            var win = window.open(selectedNode, '_blank');
            win.focus();
        } else if(e.target.dataset.action == "delete") {
            //delete action
            /*to be implemented
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
            */
            if(!hasChildren(selectedId)){
                chrome.bookmarks.remove(selectedId, function(e){});
                delete nodes[selectedNode];
                links = links.filter(function(l) {
                    return l.source.name != selectedNode && l.target.name != selectedNode;
                });
                links_backup = links_backup.filter(function(l) {
                    return l.source != selectedNode && l.target != selectedNode;
                });
                var s = d3.selectAll('svg');
                s.selectAll("*").remove();
                s = s.remove();
                generateBookmarksGraph(false);
            }

        }
    });
}
function displayBookmarks(){
    bookmarksMenu();
    triggerBookmarksRepresentation();
    setTimeout(function(){
        startingRepresentation();
        generateBookmarksGraph(true);}, 2000);
}
//BOOKMARKS - END

// SOURCE WORKER
if(source == "history"){
    displayHistory();
} else if(source == "bookmarks"){
    displayBookmarks();
} else if(source == "pocket") {

} else {
    //default is history (for corrupted data in localStorage)
    displayHistory();
}








