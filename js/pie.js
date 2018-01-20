var historyEntries = [];
var historyUrlEntries = [];
var historyDomainEntries = [];
var duPie = 0;

var bookmarkEntries = [];
var basicBookmarksStrings = [];
//settings
var source = localStorage["hivi_data_source"]; // get data source from settings
var results = parseInt(localStorage["hivi_max_entries"]); // get the displayed links number from settings
var blackList = JSON.parse(localStorage["hivi_blacklist_items"]).items; // get blackList items
if(localStorage["hostname"] == null){
    localStorage["hostname"] = "";
}
var pocketObject = JSON.parse(localStorage["hivi_pocket"]);
var bookmarksFromPocket = [];
var bookmarksFromPocketDomain = [];

//done Settings

//Pocket
function getBookmarksFromPocket(){
    for (var i in pocketObject){
        bookmarksFromPocket.push(pocketObject[i]);
    }
    console.log(pocketObject);
}



function generateDomainForPocketRepresentation(){
    for (var i = 0; i < bookmarksFromPocket.length; i++){
        if(!isBlackListed(blackList,bookmarksFromPocket[i].resolved_url)){
            bookmarksFromPocketDomain.push(bookmarksFromPocket[i].resolved_title);
        }
    }
}


function triggerRepresentationByPocket(){
    getBookmarksFromPocket();
    generateDomainForPocketRepresentation();

    drawPieByPocket();
}

function drawPieByPocket(){
    var svg = d3.select(".PieContainer")
        .append("svg")
        .append("g");

    var actualSvg = d3.select("svg")
        .attr("viewBox","0 0 1000 850")
        .attr("preserveAspectRatio","xMidYMin meet")
        .attr("id","my_svg");


    svg.append("g")
        .attr("class", "slices"); //grupul "feliilor"
    svg.append("g")
        .attr("class", "labels"); //grupul "textelor"
    svg.append("g")
        .attr("class", "lines"); // grupul liniilor de la pie la text"



    var width = 960,
        height = 600,
        radius = Math.min(width,height) / 2;

//setam layout-ul pt pie
    var pie = d3.layout.pie()  //this will create arc data for us given a list of values
        .sort(null)     //ordine aleatoare a slice-urilor
        .value(function(d) {  //we must tell it out to access the value of each element in our data array
            return d.value;
        });

    var arc = d3.svg.arc()  //pie arc
        .outerRadius(radius * 0.9) // unghi exterior
        .innerRadius(radius * 0.5); // unghi interior


    var outerArc = d3.svg.arc() // line arc
        .innerRadius(radius * 0.9) //unghiurile pentru linie
        .outerRadius(radius * 1.0);

//translatarea catre mijlocul distantelor (width,height)
    svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var key = function(d){ return d.data.label; };
    var color = d3.scale.category20c()
        .domain(bookmarksFromPocketDomain)
        .range(["#1a75ff", "#9999ff", "#ccccff", "#80dfff", "#00ace6", "#80ffbf", "#00cc66","#004d26", "#d9ff66", "#99cc00", "#ffff80", "#ffff00", "#808000", "#ff9900"
            ,"#ff8c66", "#cc3300", "#669999", "#ff6600", "#ff99cc", "#cc0066", "#4d0026","#ff80ff", "#990099", "#ff0080", "#660033", "#bb99ff", "#7733ff", "#c2c2d6",
            "#5c5c8a", "#ccffff"]);

    function domainData (){
        var labels = color.domain();
        //var labels = historyDomainEntries;
        return labels.map(function(label){
            return { label: label, value: 1 }
            //return { label: label, value: Math.random() }

        })
            .sort(function(a,b) {
                return d3.descending(a.label, b.label);
            });
    }

    change(domainData());

    function mergeWithFirstEqualZero(first, second){
        var secondSet = d3.set();
        second.forEach(function(d) { secondSet.add(d.label); });
        var onlyFirst = first
            .filter(function(d){ return !secondSet.has(d.label) })
            .map(function(d) { return {label: d.label, value: 0}; });

        return d3.merge([ second, onlyFirst ])
            .sort(function(a,b) {
                return d3.ascending(a.label, b.label);
            });
    }

    function change(data) {
        var duration = 2000;
        var data0 = svg.select(".slices").selectAll("path.slice")
            .data().map(function(d) { return d.data });
        if (data0.length == 0) data0 = data;
        var was = mergeWithFirstEqualZero(data, data0);
        var is = mergeWithFirstEqualZero(data0, data);


        /* ------- SLICE ARCS -------*/

        var slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(was), key);

        slice.enter()
            .insert("path")
            .attr("class", "slice")
            .style("fill", function(d) { return color(d.data.label); })
            .each(function(d) {
                this._current = d;
            });

        slice.on("click",function(d){
              for(var i = 0; i < bookmarksFromPocket.length; i++){
                  if( bookmarksFromPocket[i].resolved_title === d.data.label){
                      var win = window.open(bookmarksFromPocket[i].resolved_url, '_blank');
                      win.focus();
                  }
              }

        });

        slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(is), key);
        slice
            .transition().duration(duration)
            .attrTween("d", function(d) {
                var interpolate = d3.interpolate(this._current, d);
                var _this = this;
                return function(t) {
                    _this._current = interpolate(t);
                    return arc(_this._current);
                };
            });

        slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(data), key);

        slice
            .exit().transition().delay(duration).duration(0)
            .remove();

        /* ------- TEXT LABELS -------*/

        var text = svg.select(".labels").selectAll("text")
            .data(pie(was), key);

        text.enter()
            .append("text")
            .attr("dy", ".35em")
            .style("opacity", 0)
            .text(function(d){
                for(var i = 0; i < bookmarksFromPocket.length; i++){
                    if( bookmarksFromPocket[i].resolved_title === d.data.label && d.data.label === ""){

                        return extractRootDomain(bookmarksFromPocket[i].resolved_url);

                    }
                    else{
                        return d.data.label;
                    }
                }
            })
            .each(function(d) {
                this._current = d;
            });

        function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
        }

        text = svg.select(".labels").selectAll("text")
            .data(pie(is), key);

        text.transition().duration(duration)
            .style("opacity", function(d) {
                return d.data.value == 0 ? 0 : 1;
            })
            .attrTween("transform", function(d) {
                var interpolate = d3.interpolate(this._current, d);
                var _this = this;
                return function(t) {
                    var d2 = interpolate(t);
                    _this._current = d2;
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    return "translate("+ pos +")";
                };
            })
            .styleTween("text-anchor", function(d){
                var interpolate = d3.interpolate(this._current, d);
                return function(t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start":"end";
                };
            });

        text = svg.select(".labels").selectAll("text")
            .data(pie(data), key);

        text
            .attr("style","background-color: #333; width: 200px;")
            .exit().transition().delay(duration)
            .remove();

        /* ------- SLICE TO TEXT POLYLINES -------*/

        var polyline = svg.select(".lines").selectAll("polyline")

            .data(pie(was), key);

        polyline.enter()
            .append("polyline")
            .style("opacity", 0)
            .each(function(d) {
                this._current = d;
            });

        polyline = svg.select(".lines").selectAll("polyline")
            .data(pie(is), key);

        polyline.transition().duration(duration)
            .style("opacity", function(d) {
                return d.data.value == 0 ? 0 : 1;
            })
            .attrTween("points", function(d){
                this._current = this._current;
                var interpolate = d3.interpolate(this._current, d);
                var _this = this;
                return function(t) {
                    var d2 = interpolate(t);
                    _this._current = d2;
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos];
                };
            });

        polyline = svg.select(".lines").selectAll("polyline")

            .data(pie(data), key);

        polyline
            .attr("style"," stroke: #333;" + "stroke-width: 1px;" + "fill: none;")
            .exit().transition().delay(duration)
            .remove();


    };
}


//Done Pocket

//check if an item is on the blacklist
function isBlackListed(list,item){
    for(var i = 0; i < list.length; i++) {
        if(item == list[i]){
            return true;
        }
    }
    return false;
}

//extract hostname for an url [include "www" as a link]
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

//extract domain for an url [without "www" as a text]
function extractRootDomain(url) {
    var domain = extractHostname(url);
    var splitArr = domain.split('.');
    var arrLen = splitArr.length;

    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
    }
    return domain;
}


//Start History
function triggerRepresentationByHistory(startDate,endDate,max_entries,blacklist) {
    chrome.history.search({text: '', maxResults: max_entries, startTime:startDate, endTime:endDate}, function (data) {
            data.forEach(function(page) {
                if(!isBlackListed(blacklist,page.url) && (extractHostname(page.url) != extractHostname(chrome.extension.getURL("")))){

                    historyEntries.push(page);
                    historyUrlEntries.push(page.url);
                    historyDomainEntries.push(extractRootDomain(page.url));

                }
            });

        drawPie();

    });
}


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



document.getElementById("start").addEventListener("change",function(e){
    start = (new Date(e.srcElement.value)).setHours(0,0,0,0);
    var s = d3.selectAll('svg');
    s.selectAll("*").remove();
    s = s.remove();
   triggerRepresentationByHistory(start,end,results,blackList);
   // setTimeout(function(){ triggerRepresentationByHistory(start,end,results,blackList); }, 2000);
});

document.getElementById("end").addEventListener("change",function(e){
    end = (new Date(e.srcElement.value)).setHours(23,59,59,999);
    var s = d3.selectAll('svg');
    s.selectAll("*").remove();
    s = s.remove();
   triggerRepresentationByHistory(start,end,results,blackList);
   // setTimeout(function(){triggerRepresentationByHistory(start,end,results,blackList);}, 2000);
});


function getUrlsForALabel(label){
    var urls = [];
    for(var i = 0; i < historyEntries.length; i++){
        var urlDetails ={};
        if(label == extractRootDomain(historyEntries[i].url) ){
            urlDetails.url = historyEntries[i].url;
            urlDetails.title = historyEntries[i].title;
            urls.push(urlDetails);
        }
    }
    console.log(urls);
    return urls;
}


function getUrlsForALabelStrings(label){
    var urls = [];
    for(var i = 0; i < historyEntries.length; i++){
        if(label == extractRootDomain(historyEntries[i].url) ){
            urls.push(historyEntries[i].url)
        }
    }
    return urls;
}

function getTitleForUrl(url){
    for(var i = 0; i < historyEntries.length; i++){
        if(url == historyEntries[i].url){
            return historyEntries[i].title;
        }

    }
    return url;
}

function getValueForALabel(label){

    var frequency = 0;
    for(var i = 0; i < historyUrlEntries.length; i++){
        if (label === extractRootDomain(historyUrlEntries[i])){
            frequency++;
        }
    }
    return frequency;
}
//Done History


function drawPie() {


var svg = d3.select(".PieContainer")
    .append("svg")
    .append("g");

 var actualSvg = d3.select("svg")
        .attr("viewBox","0 0 1000 850")
        .attr("preserveAspectRatio","xMidYMin meet")
        .attr("id","my_svg");


svg.append("g")
    .attr("class", "slices"); //grupul "feliilor"
svg.append("g")
    .attr("class", "labels"); //grupul "textelor"
svg.append("g")
    .attr("class", "lines"); // grupul liniilor de la pie la text"
svg.append("g")
    .attr("class", "center"); // go back button




var width = 960,
    height = 600,
    radius = Math.min(width,height) / 2;

//setam layout-ul pt pie
var pie = d3.layout.pie()  //this will create arc data for us given a list of values
    .sort(null)     //ordine aleatoare a slice-urilor
    .value(function(d) {  //we must tell it out to access the value of each element in our data array
        return d.value;
    });

var arc = d3.svg.arc()  //pie arc
    .outerRadius(radius * 0.9) // unghi exterior
    .innerRadius(radius * 0.5); // unghi interior


var outerArc = d3.svg.arc() // line arc
    .innerRadius(radius * 0.9) //unghiurile pentru linie
    .outerRadius(radius * 1.0);

//translatarea catre mijlocul distantelor (width,height)
svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var key = function(d){ return d.data.label; };

var color = d3.scale.category20c()
    .domain(historyDomainEntries)
    .range(["#1a75ff", "#9999ff", "#ccccff", "#80dfff", "#00ace6", "#80ffbf", "#00cc66","#004d26", "#d9ff66", "#99cc00", "#ffff80", "#ffff00", "#808000", "#ff9900"
    ,"#ff8c66", "#cc3300", "#669999", "#ff6600", "#ff99cc", "#cc0066", "#4d0026","#ff80ff", "#990099", "#ff0080", "#660033", "#bb99ff", "#7733ff", "#c2c2d6",
        "#5c5c8a", "#ccffff"]);

function domainData (){
    var labels = color.domain();
    //var labels = historyDomainEntries;
    return labels.map(function(label){
        return { label: label, value: getValueForALabel(label) }
        //return { label: label, value: Math.random() }

    })
    .sort(function(a,b) {
        return d3.descending(a.label, b.label);
    });
}

change(domainData());

function urlsDataForADomain (domain){
    var color = d3.scale.category20c()
        .domain(getUrlsForALabelStrings(domain))
        .range(["#1a75ff", "#9999ff", "#ccccff", "#80dfff", "#00ace6", "#80ffbf", "#00cc66","#004d26", "#d9ff66", "#99cc00", "#ffff80", "#ffff00", "#808000", "#ff9900"
            ,"#ff8c66", "#cc3300", "#669999", "#ff6600", "#ff99cc", "#cc0066", "#4d0026","#ff80ff", "#990099", "#ff0080", "#660033", "#bb99ff", "#7733ff", "#c2c2d6",
            "#5c5c8a", "#ccffff"]);
    var urlLabels = color.domain();
    console.log(urlLabels);
    return urlLabels.map(function(urlLabel){
        //return {label: getTitleForUrl(urlLabel), value: Math.random()}
        return {label: urlLabel, value: 1}
    });
}


function mergeWithFirstEqualZero(first, second){
    var secondSet = d3.set();
    second.forEach(function(d) { secondSet.add(d.label); });
    var onlyFirst = first
        .filter(function(d){ return !secondSet.has(d.label) })
        .map(function(d) { return {label: d.label, value: 0}; });

    return d3.merge([ second, onlyFirst ])
        .sort(function(a,b) {
            return d3.ascending(a.label, b.label);
        });
}

function change(data) {
    var duration = 2000;
    var data0 = svg.select(".slices").selectAll("path.slice")
        .data().map(function(d) { return d.data });
    if (data0.length == 0) data0 = data;
    var was = mergeWithFirstEqualZero(data, data0);
    var is = mergeWithFirstEqualZero(data0, data);

   /* var actualCenter = svg.select(".center");
    console.log(actualCenter);
    if(actualCenter != null){
        actualCenter.remove();
    }*/


    /* ------- SLICE ARCS -------*/

    var slice = svg.select(".slices").selectAll("path.slice")
        .data(pie(was), key);

    slice.enter()
        .insert("path")
        .attr("class", "slice")
        .style("fill", function(d) { return color(d.data.label); })
        .each(function(d) {
            this._current = d;
        });

    slice.on("click",function(d){
        if (duPie == 0) {
            var x = urlsDataForADomain(d.data.label);
            duPie = 1;
            change(x);
        }
        else
        {
            var win = window.open(d.data.label, '_blank');
            win.focus();
        }

    });

    slice = svg.select(".slices").selectAll("path.slice")
        .data(pie(is), key);

    slice
        .transition().duration(duration)
        .attrTween("d", function(d) {
            var interpolate = d3.interpolate(this._current, d);
            var _this = this;
            return function(t) {
                _this._current = interpolate(t);
                return arc(_this._current);
            };
        });

    slice = svg.select(".slices").selectAll("path.slice")
        .data(pie(data), key);

    slice
        .exit().transition().delay(duration).duration(0)
        .remove();

    /* ------- TEXT LABELS -------*/

    var text = svg.select(".labels").selectAll("text")
        .data(pie(was), key);

    text.enter()
        .append("text")
        .attr("dy", ".35em")
        .style("opacity", 0)
        .text(function(d) {
            var x = getTitleForUrl(d.data.label);
            if (x.length == 0){
                return extractRootDomain(d.data.label);
            }
            return x;
        })
        .each(function(d) {
            this._current = d;
        });

    function midAngle(d){
        return d.startAngle + (d.endAngle - d.startAngle)/2;
    }

    text = svg.select(".labels").selectAll("text")
        .data(pie(is), key);

    text.transition().duration(duration)
        .style("opacity", function(d) {
            return d.data.value == 0 ? 0 : 1;
        })
        .attrTween("transform", function(d) {
            var interpolate = d3.interpolate(this._current, d);
            var _this = this;
            return function(t) {
                var d2 = interpolate(t);
                _this._current = d2;
                var pos = outerArc.centroid(d2);
                pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                return "translate("+ pos +")";
            };
        })
        .styleTween("text-anchor", function(d){
            var interpolate = d3.interpolate(this._current, d);
            return function(t) {
                var d2 = interpolate(t);
                return midAngle(d2) < Math.PI ? "start":"end";
            };
        });

    text = svg.select(".labels").selectAll("text")
        .data(pie(data), key);

    text
        .attr("style","background-color: #333; width: 200px;")
        .exit().transition().delay(duration)
        .remove();

    /* ------- SLICE TO TEXT POLYLINES -------*/

    var polyline = svg.select(".lines").selectAll("polyline")

        .data(pie(was), key);

    polyline.enter()
        .append("polyline")
        .style("opacity", 0)
        .each(function(d) {
            this._current = d;
        });

    polyline = svg.select(".lines").selectAll("polyline")
        .data(pie(is), key);

    polyline.transition().duration(duration)
        .style("opacity", function(d) {
            return d.data.value == 0 ? 0 : 1;
        })
        .attrTween("points", function(d){
            this._current = this._current;
            var interpolate = d3.interpolate(this._current, d);
            var _this = this;
            return function(t) {
                var d2 = interpolate(t);
                _this._current = d2;
                var pos = outerArc.centroid(d2);
                pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                return [arc.centroid(d2), outerArc.centroid(d2), pos];
            };
        });

    polyline = svg.select(".lines").selectAll("polyline")

        .data(pie(data), key);

    polyline
        .attr("style"," stroke: #333;" + "stroke-width: 1px;" + "fill: none;")
        .exit().transition().delay(duration)
        .remove();


    /* ------- Center -------*/
    var center = svg.select(".center");

    // The circle displaying back button
    center.append("svg:circle")
        .attr("r", radius  * 0.3)
        .style("fill", "#E7E7E7")
        .on("click",function(){
            if(duPie == 0){
            }
            else{
                duPie = 0;
                change(domainData());
            }

        });

    center.append("text")
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size','15px')
        .style("opacity", function() {
        return duPie ? 1:0;
    })
        .text("Go Back");


};
}

// SOURCE WORKER
if(source === "history") {
    triggerRepresentationByHistory(start,end,results,blackList);
} else if(source === "bookmarks") {
    triggerRepresentationByBookmark();
} else if(source === "pocket") {
    triggerRepresentationByPocket();

} else {
    //default is history (for corrupted data in localStorage)
    triggerRepresentationByHistory(start,end,results,blackList);
}


//Start Bookmarks

function triggerRepresentationByBookmark(){

    chrome.bookmarks.getTree(function(data){
        for(var i = 0; i < data[0].children.length; i++) {
            bookmarkEntries.push(data[0].children[i]);
            basicBookmarksStrings.push(data[0].children[i].title);
        }

    });
    console.log(bookmarkEntries);
    setTimeout(function(){drawPieByBookmarks();},1);
}



//Done Bookmarks

function drawPieByBookmarks(){
    var svg = d3.select(".PieContainer")
        .append("svg")
        .append("g");

    var actualSvg = d3.select("svg")
        .attr("viewBox","0 0 1000 850")
        .attr("preserveAspectRatio","xMidYMin meet")
        .attr("id","my_svg");


    svg.append("g")
        .attr("class", "slices"); //grupul "feliilor"
    svg.append("g")
        .attr("class", "labels"); //grupul "textelor"
    svg.append("g")
        .attr("class", "lines"); // grupul liniilor de la pie la text"
    svg.append("g")
        .attr("class", "center"); // go back button


    var width = 960,
        height = 600,
        radius = Math.min(width,height) / 2;

//setam layout-ul pt pie
    var pie = d3.layout.pie()  //this will create arc data for us given a list of values
        .sort(null)     //ordine aleatoare a slice-urilor
        .value(function(d) {  //we must tell it out to access the value of each element in our data array
            return d.value;
        });

    var arc = d3.svg.arc()  //pie arc
        .outerRadius(radius * 0.9) // unghi exterior
        .innerRadius(radius * 0.5); // unghi interior


    var outerArc = d3.svg.arc() // line arc
        .innerRadius(radius * 0.9) //unghiurile pentru linie
        .outerRadius(radius * 1.0);

//translatarea catre mijlocul distantelor (width,height)
    svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var key = function(d){ return d.data.label; };

    var color = d3.scale.category20c()
        .domain(basicBookmarksStrings)
        .range(["#1a75ff", "#9999ff", "#ccccff", "#80dfff", "#00ace6", "#80ffbf", "#00cc66","#004d26", "#d9ff66", "#99cc00", "#ffff80", "#ffff00", "#808000", "#ff9900"
            ,"#ff8c66", "#cc3300", "#669999", "#ff6600", "#ff99cc", "#cc0066", "#4d0026","#ff80ff", "#990099", "#ff0080", "#660033", "#bb99ff", "#7733ff", "#c2c2d6",
            "#5c5c8a", "#ccffff"]);

    function domainData (){
        var labels = color.domain();
        return labels.map(function(label){
            return { label: label, value: 1 }
            //return { label: label, value: Math.random() }

        })
        /* .sort(function(a,b) {
             return d3.descending(a.label, b.label);
         });*/
    }

    change(domainData());

    function urlsDataForADomain (domain){
        var color = d3.scale.category20c()
            .domain(getUrlsForALabelStrings(domain))
            .range(["#1a75ff", "#9999ff", "#ccccff", "#80dfff", "#00ace6", "#80ffbf", "#00cc66","#004d26", "#d9ff66", "#99cc00", "#ffff80", "#ffff00", "#808000", "#ff9900"
                ,"#ff8c66", "#cc3300", "#669999", "#ff6600", "#ff99cc", "#cc0066", "#4d0026","#ff80ff", "#990099", "#ff0080", "#660033", "#bb99ff", "#7733ff", "#c2c2d6",
                "#5c5c8a", "#ccffff"]);
        var urlLabels = color.domain();
        console.log(urlLabels);
        return urlLabels.map(function(urlLabel){
            //return {label: getTitleForUrl(urlLabel), value: Math.random()}
            return {label: urlLabel, value: 1}
        });
    }


    function mergeWithFirstEqualZero(first, second){
        var secondSet = d3.set();
        second.forEach(function(d) { secondSet.add(d.label); });
        var onlyFirst = first
            .filter(function(d){ return !secondSet.has(d.label) })
            .map(function(d) { return {label: d.label, value: 0}; });

        return d3.merge([ second, onlyFirst ])
            .sort(function(a,b) {
                return d3.ascending(a.label, b.label);
            });
    }

    function change(data) {
        var duration = 2000;
        var data0 = svg.select(".slices").selectAll("path.slice")
            .data().map(function(d) { return d.data });
        if (data0.length == 0) data0 = data;
        var was = mergeWithFirstEqualZero(data, data0);
        var is = mergeWithFirstEqualZero(data0, data);

        /* var actualCenter = svg.select(".center");
         console.log(actualCenter);
         if(actualCenter != null){
             actualCenter.remove();
         }*/


        /* ------- SLICE ARCS -------*/

        var slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(was), key);

        slice.enter()
            .insert("path")
            .attr("class", "slice")
            .style("fill", function(d) { return color(d.data.label); })
            .each(function(d) {
                this._current = d;
            });

       /* slice.on("click",function(d){
            if (duPie == 0) {
                var x = urlsDataForADomain(d.data.label);
                duPie = 1;
                change(x);
            }
            else
            {
                var win = window.open(d.data.label, '_blank');
                win.focus();
            }

        });*/

        slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(is), key);

        slice
            .transition().duration(duration)
            .attrTween("d", function(d) {
                var interpolate = d3.interpolate(this._current, d);
                var _this = this;
                return function(t) {
                    _this._current = interpolate(t);
                    return arc(_this._current);
                };
            });

        slice = svg.select(".slices").selectAll("path.slice")
            .data(pie(data), key);

        slice
            .exit().transition().delay(duration).duration(0)
            .remove();

        /* ------- TEXT LABELS -------*/

        var text = svg.select(".labels").selectAll("text")
            .data(pie(was), key);

        text.enter()
            .append("text")
            .attr("dy", ".35em")
            .style("opacity", 0)
          /*  .text(function(d) {
                var x = getTitleForUrl(d.data.label);
                if (x.length == 0){
                    return extractRootDomain(d.data.label);
                }
                return x;
            })*/
            .text(function(d){
                return d.data.label;
            })
            .each(function(d) {
                this._current = d;
            });

        function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
        }

        text = svg.select(".labels").selectAll("text")
            .data(pie(is), key);

        text.transition().duration(duration)
            .style("opacity", function(d) {
                return d.data.value == 0 ? 0 : 1;
            })
            .attrTween("transform", function(d) {
                var interpolate = d3.interpolate(this._current, d);
                var _this = this;
                return function(t) {
                    var d2 = interpolate(t);
                    _this._current = d2;
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    return "translate("+ pos +")";
                };
            })
            .styleTween("text-anchor", function(d){
                var interpolate = d3.interpolate(this._current, d);
                return function(t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start":"end";
                };
            });

        text = svg.select(".labels").selectAll("text")
            .data(pie(data), key);

        text
            .attr("style","background-color: #333; width: 200px;")
            .exit().transition().delay(duration)
            .remove();

        /* ------- SLICE TO TEXT POLYLINES -------*/

        var polyline = svg.select(".lines").selectAll("polyline")

            .data(pie(was), key);

        polyline.enter()
            .append("polyline")
            .style("opacity", 0)
            .each(function(d) {
                this._current = d;
            });

        polyline = svg.select(".lines").selectAll("polyline")
            .data(pie(is), key);

        polyline.transition().duration(duration)
            .style("opacity", function(d) {
                return d.data.value == 0 ? 0 : 1;
            })
            .attrTween("points", function(d){
                this._current = this._current;
                var interpolate = d3.interpolate(this._current, d);
                var _this = this;
                return function(t) {
                    var d2 = interpolate(t);
                    _this._current = d2;
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos];
                };
            });

        polyline = svg.select(".lines").selectAll("polyline")

            .data(pie(data), key);

        polyline
            .attr("style"," stroke: #333;" + "stroke-width: 1px;" + "fill: none;")
            .exit().transition().delay(duration)
            .remove();


        /* ------- Center -------*/
        var center = svg.select(".center");

        // The circle displaying back button
        center.append("svg:circle")
            .attr("r", radius  * 0.3)
            .style("fill", "#E7E7E7")
            .on("click",function(){
                if(duPie == 0){
                }
                else{
                    duPie = 0;
                    change(domainData());
                }

            });

        center.append("text")
            .attr('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size','15px')
            .style("opacity", function() {
                return duPie ? 1:0;
            })
            .text("Go Back");


    };

}