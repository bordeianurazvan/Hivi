
//settings
var source = localStorage["hivi_data_source"];
var blackList = JSON.parse(localStorage["hivi_blacklist_items"]).items;
var results = 20;
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

function containCharacter(string, char){
    for(var i = 0; i < string.length; i++) {
        if(char === string[i]){
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

//Function which creates the a table based on a URL
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
        if (xmlHttp.readyState === 4){
            if( xmlHttp.status === 200){
                //extract data
                var dataUri = JSON.parse(xmlHttp.responseText);
                var image = dataUri.screenshot.data;
                var image2 = replaceInString(image, "_", "/");
                var image3 = replaceInString(image2, "-", "+");
                //main container
                var node = document.getElementById("thumbnail");

                var table = document.createElement("table");
                table.setAttribute("style","border-radius: 10px; display: inline-block; background-color: black; margin: 5px");

                //url row
                var firstRow = document.createElement("tr");
                var urlNode = document.createElement("td");
                urlNode.setAttribute("style","max-width: 40px;" +
                    "    text-overflow: ellipsis;" +
                    "    overflow: hidden;" +
                    "    white-space: nowrap;");
                var actualUrl = document.createElement("a");
                var text = document.createTextNode(theUrl);
                actualUrl.appendChild(text);
                actualUrl.setAttribute("style","color: white;");
                if(host == "") {
                    actualUrl.setAttribute("href",page_url);
                    actualUrl.addEventListener("click", function () {
                        localStorageGetsUrl(theUrl);
                    })
                }else{
                    actualUrl.addEventListener("click", function (){
                        var win = window.open(theUrl, '_blank');
                        win.focus();
                    })
                }

                urlNode.appendChild(actualUrl);
                firstRow.appendChild(urlNode);
                table.appendChild(firstRow);

                //image row
                var secondRow = document.createElement("tr");
                var imageNode = document.createElement("td");
                imageNode.setAttribute("style","border-radius: 10px;");
                var imgUrl = document.createElement("a");
                if(host == ""){
                    imgUrl.setAttribute("href",page_url);
                    imgUrl.addEventListener("click",function() {localStorageGetsUrl(theUrl);})
                }else{
                    imgUrl.addEventListener("click", function (){
                        var win = window.open(theUrl, '_blank');
                        win.focus();
                    })
                }
                var img = document.createElement("img");
                img.setAttribute("src","data:image/jpeg;base64,"+image3);
                img.setAttribute("style","border-radius: 10px;");
                imgUrl.appendChild(img);

                imageNode.appendChild(imgUrl);
                secondRow.appendChild(imageNode);
                table.appendChild(secondRow);

                //append table to base node
                node.appendChild(table);
            }
        }
    }

    var  url2= "https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url="+theUrl+"&screenshot=true";
    xmlHttp.open("GET", url2, true); // true for asynchronous
    xmlHttp.send(null);

}

//Function which replace a charachter with another in an given string
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

//Function which takes data from history and creates the representation using httpGetAsync
function triggerRepresentationByHistory(startDate,endDate,blacklist) {
    chrome.history.search({text: '', startTime:startDate, endTime:endDate}, function (data) {
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
            var contor = 0;
            data.forEach(function(page) {
                if(!isBlackListed(blacklist,page.url) && (extractHostname(page.url) == localStorage["hostname"]) && contor < results && !containCharacter(page.url,";")){
                    contor = contor + 1;
                    httpGetAsync(page.url);
                }
            });

        }
        localStorage["hostname"] = "";
    });

    document.getElementById("dateSubmit").disabled = false;
}

//Function which takes data from Pocket and creates the representation using httpGetAsync
function triggerReprezentationByPocket(blacklist,pocketObject){
    localStorage["hostname"] = "pocket";
    var contor = 0;
    for (var i in pocketObject){
        var url = pocketObject[i].resolved_url;
        if(!isBlackListed(blacklist,url) && contor < results){
            contor = contor + 1;
            httpGetAsync(url);
        }
    }
    localStorage["hostname"] = "";
}

//Function which creates an object based on the data from the bookmarks
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
}

//Function which creates the frolder reprezentation from bookmarks
function displayfolder(name){
    var node = document.getElementById("thumbnail");

    var table = document.createElement("table");
    table.setAttribute("style","border-radius: 10px; display: inline-block; background-color: black; margin: 5px");

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
    actualUrl.setAttribute("style","color: white;");
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
    imageNode.setAttribute("style","border-radius: 10px;");
    var imgUrl = document.createElement("a");
    imgUrl.setAttribute("href","thumbnails.html");
    imgUrl.addEventListener("click",function() {localStorageGetsUrl(name);});
    var img = document.createElement("img");
    img.setAttribute("src","img/folder.png");
    img.setAttribute("style","border-radius: 10px;")
    imgUrl.appendChild(img);

    imageNode.appendChild(imgUrl);
    secondRow.appendChild(imageNode);
    table.appendChild(secondRow);

    //append table to base node
    node.appendChild(table);
}

//Function which creates bookmarks representation using httpGetAsync
function triggerReprezentationByBookmarks(folders_list, blacklist){
    if(localStorage["hostname"] == ""){
        for (key in folders_list){
            displayfolder(key);
        }
    }else{
        var folder = localStorage["hostname"];
        for(var i = 0; i < folders_list[folder].length; i++){
            if(!isBlackListed(blacklist,folders_list[folder][i])){
                httpGetAsync(folders_list[folder][i]);
            }
        }
        localStorage["hostname"] = "";
    }
}

//Main function
function displayHistory(){

    //working with date interval
    var today = new Date();
    var dd = today.getDate();
    if (dd < 10) {
        dd = '0' + dd;
    }
    var mm = today.getMonth()+1; //January is 0!
    if (mm < 10) {
        mm = '0' + mm;
    }
    var yyyy = today.getFullYear();
    var startDate =  "" + yyyy + "-" + mm + "-" + dd;
    var endDate = "" + yyyy + "-" + mm + "-" + dd;
    document.getElementById("start").value = startDate;
    document.getElementById("end").value = endDate;
    var start = (new Date(startDate)).setHours(0,0,0,0);
    var end = (new Date(endDate)).setHours(23,59,59,999);
    //end
    if(source == "history"){
        triggerRepresentationByHistory(start,end,blackList);

        document.getElementById("dateSubmit").addEventListener("click",function(e){
            document.getElementById("dateSubmit").disabled = true;
            start = (new Date(document.getElementById("start").value)).setHours(0,0,0,0);
            end = (new Date(document.getElementById("end").value)).setHours(23,59,59,999);
            document.getElementById("thumbnail").innerHTML = "";
            triggerRepresentationByHistory(start,end,blackList);
        });
    }else{
        if(source == "bookmarks"){
            var element = document.getElementById("data");
            element.parentNode.removeChild(element);
            chrome.bookmarks.getTree(function(data){
            folders_list = {};
            getLinksFromBookmarks(folders_list, "Bookmarks bar", data[0]);
            triggerReprezentationByBookmarks(folders_list, blackList);
        });
        }else{
            var element = document.getElementById("data");
            element.parentNode.removeChild(element);
            var pocketObject = JSON.parse(localStorage["hivi_pocket"]);
            triggerReprezentationByPocket(blackList,pocketObject);
        }
    }

}

//Calling the main function
displayHistory();