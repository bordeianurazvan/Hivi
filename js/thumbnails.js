
//settings
var source = localStorage["hivi_data_source"];
var results = parseInt(localStorage["hivi_max_entries"]);
var blackList = JSON.parse(localStorage["hivi_blacklist_items"]).items;
var links_list = [];
if(localStorage["hostname"] == null){
    localStorage["hostname"] = "";
}
//done


function isBlackListed(list,item){
    for(var i = 0; i < list.length; i++) {
        if(item == list[i]){
            return true;
        }
    }
    return false;
}

function extractHostname(url) {
    var hostname;
    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[0] + "/" + url.split('/')[1] + "/" + url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    return hostname;
}

function localStorageGetsUrl(url){
    localStorage["hostname"] = url;
}

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    var host = localStorage["hostname"];
    if(host == ""){
        page_url = "thumbnails.html";
    }else{
        page_url = theUrl;
    }
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            //extract data
            var dataUri = JSON.parse(xmlHttp.responseText);
            var image = dataUri.screenshot.data;
            var image2 = replaceInString(image, "_", "/");
            var image3 = replaceInString(image2, "-", "+");
            //main container
            var node = document.getElementById("thumbnail");

            var table = document.createElement("table");
            table.setAttribute("style","border:2px solid black; display: inline-block;");

            //url row
            var firstRow = document.createElement("tr");
            var urlNode = document.createElement("td");
            urlNode.setAttribute("style","max-width: 40px;" +
                "    text-overflow: ellipsis;" +
                "    overflow: hidden;" +
                "    white-space: nowrap;");
            var actualUrl = document.createElement("a");
            var text = document.createTextNode(theUrl);
            actualUrl.setAttribute("href",page_url);
            if(host == "") {
                actualUrl.addEventListener("click", function () {
                    localStorageGetsUrl(theUrl);
                })
            }


            actualUrl.appendChild(text);
            urlNode.appendChild(actualUrl);
            firstRow.appendChild(urlNode);
            table.appendChild(firstRow);

            //image row
            var secondRow = document.createElement("tr");
            var imageNode = document.createElement("td");
            imageNode.setAttribute("style","border:2px solid black;");
            var imgUrl = document.createElement("a");
            imgUrl.setAttribute("href",page_url);
            if(host == ""){
                imgUrl.addEventListener("click",function() {localStorageGetsUrl(theUrl);})
            }
            var img = document.createElement("img");
            img.setAttribute("src","data:image/jpeg;base64,"+image3);
            imgUrl.appendChild(img);

            imageNode.appendChild(imgUrl);
            secondRow.appendChild(imageNode);
            table.appendChild(secondRow);

            //append table to base node
            node.appendChild(table);
        }
    }
    var  url2= "https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url="+theUrl+"&screenshot=true";
    xmlHttp.open("GET", url2, true); // true for asynchronous
    xmlHttp.send(null);
}
function replaceInString(string, character, characterToReplace){
    var newString = "";
    for(var i = 0; i < string.length; i++) {
        if(string[i] === character) {
            newString += characterToReplace;
        } else {
            newString += string[i];
        }
    }
    return newString;
}

function triggerRepresentationByHistory(startDate,endDate,max_entries,blacklist) {
    chrome.history.search({text: '', maxResults: max_entries, startTime:startDate, endTime:endDate}, function (data) {
        if(localStorage["hostname"] == ""){
            var list = {};
            data.forEach(function(page) {
                if(!isBlackListed(blacklist,page.url) && (extractHostname(page.url) != extractHostname(chrome.extension.getURL("")))){
                    var string = extractHostname(page.url);
                    if(list[string] == null){
                        httpGetAsync(extractHostname(page.url));
                        list[string] = 1;
                    }
                }
            });
        }else{
            data.forEach(function(page) {
                if(!isBlackListed(blacklist,page.url) && (extractHostname(page.url) == localStorage["hostname"])){
                    httpGetAsync(page.url);
                }
            });
            localStorage["hostname"] = "";
        }
    });
}

function getLinksFromBookmarks(folders, key, data){
    if(data.hasOwnProperty("children")) {
        for (var i = 0; i < data.children.length; i++) {
            getLinksFromBookmarks(folders, data.title, data.children[i]);
        }
    }else{
        if(data.url != null) {
            if (folders[key] != null)
                folders[key].push(data.url);
            else{
                folders[key] = [];
                folders[key].push(data.url);
            }
        }
    }
    return links_list;
}


function displayfolder(name){
    var node = document.getElementById("thumbnail");

    var table = document.createElement("table");
    table.setAttribute("style","border:2px solid black; display: inline-block;");

    //url row
    var firstRow = document.createElement("tr");
    var urlNode = document.createElement("td");
    urlNode.setAttribute("style","max-width: 40px;" +
        "    text-overflow: ellipsis;" +
        "    overflow: hidden;" +
        "    white-space: nowrap;");
    var actualUrl = document.createElement("a");
    var text = document.createTextNode(name);
    actualUrl.setAttribute("href","thumbnails.html");
    actualUrl.addEventListener("click", function () {
        localStorageGetsUrl(name);
    });


    actualUrl.appendChild(text);
    urlNode.appendChild(actualUrl);
    firstRow.appendChild(urlNode);
    table.appendChild(firstRow);

    //image row
    var secondRow = document.createElement("tr");
    var imageNode = document.createElement("td");
    imageNode.setAttribute("style","border:2px solid black;");
    var imgUrl = document.createElement("a");
    imgUrl.setAttribute("href","thumbnails.html");
    imgUrl.addEventListener("click",function() {localStorageGetsUrl(name);});
    var img = document.createElement("img");
    img.setAttribute("src","img/folder.png");
    imgUrl.appendChild(img);

    imageNode.appendChild(imgUrl);
    secondRow.appendChild(imageNode);
    table.appendChild(secondRow);

    //append table to base node
    node.appendChild(table);
}

function triggerReprezentationByBookmarks(folders_list, blacklist){
    if(localStorage["hostname"] == ""){
        for (key in folders_list){
            console.log(key);
            displayfolder(key);
        }
    }else{
        console.log(localStorage["hostname"]);
        var folder = localStorage["hostname"];
        for(var i = 0; i < folders_list[folder].length; i++){
            if(!isBlackListed(blacklist,folders_list[folder][i])){
                httpGetAsync(folders_list[folder][i]);
            }
        }
        localStorage["hostname"] = "";
    }
}

function displayHistory(){

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
    if(source == "history"){
        triggerRepresentationByHistory(start,end,results,blackList);

        document.getElementById("start").addEventListener("change",function(e){
            start = (new Date(e.srcElement.value)).setHours(0,0,0,0);
            document.getElementById('thumbnail').innerHTML = "";
            triggerRepresentationByHistory(start,end,results,blackList);
            setTimeout(function(){ generateHistoryGraph(true) }, 2000);
        });
        document.getElementById("end").addEventListener("change",function(e){
            end = (new Date(e.srcElement.value)).setHours(23,59,59,999);
            document.getElementById('thumbnail').innerHTML = "";
            triggerRepresentationByHistory(start,end,results,blackList);
            setTimeout(function(){ generateHistoryGraph(true) }, 2000);
        })
    }else{
        chrome.bookmarks.getTree(function(data){
            folders_list = {};
            getLinksFromBookmarks(folders_list, "Bookmarks bar", data[0]);
            console.log(folders_list);
            triggerReprezentationByBookmarks(folders_list, blackList);
        });
    }

}

displayHistory();
