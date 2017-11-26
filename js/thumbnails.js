function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
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
            actualUrl.setAttribute("href",theUrl);

            actualUrl.appendChild(text);
            urlNode.appendChild(actualUrl);
            firstRow.appendChild(urlNode);
            table.appendChild(firstRow);

            //image row
            var secondRow = document.createElement("tr");
            var imageNode = document.createElement("td");
            imageNode.setAttribute("style","border:2px solid black;");
            var img = document.createElement("img");
            img.setAttribute("src","data:image/jpeg;base64,"+image3);

            imageNode.appendChild(img);
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
function triggerHistoryRepresentation2(){
    chrome.history.search({text: '', maxResults: 15}, function(data) {

        data.forEach(function(page) {

            httpGetAsync(page.url);

        });
    });
}
triggerHistoryRepresentation2();
