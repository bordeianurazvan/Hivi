var urls = [];

function triggerHistoryRepresentation(){
    chrome.history.search({text: '', maxResults: 10}, function(data) {
        urls = [];
        data.forEach(function(page) {
            urls.push(page);


        });

    });
}

//extract hostname for an url
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

//extract domain for an url
function extractRootDomain(url) {
    var domain = extractHostname(url);
    var splitArr = domain.split('.');
    var arrLen = splitArr.length;

    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}

function getDomainsByUrls(listOfUrls){
    var domainsList = [];


    for (var i = 0; i < listOfUrls.length; i++){

        var rootDomain = extractRootDomain(listOfUrls[i].url);
        var found = false;

        for (var j = 0; j < domainsList.length ; j++){
            if (domainsList[j].name === rootDomain ) {
                found = true;
                domainsList[j].frequency +=1;
            }
        }
        if (found == false){

            var domain = {};
            domain.name = rootDomain;
            domain.frequency = 1;

            domainsList.push(domain);
        }
    }
    return domainsList;
}

function getTotalFrequencies(listOfDomains){

    var totalFrequencies = 0;

    for (var i = 0; i < listOfDomains.length; i++){
        totalFrequencies += listOfDomains[i].frequency;
    }

    return totalFrequencies;

}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function drawPieByDomains(listOfUrls){
    var domainsList = getDomainsByUrls(listOfUrls);
    var totalFrequencies = getTotalFrequencies(domainsList);

    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");
    var lastend = 0;
    var color;

    for (var i = 0; i < domainsList.length; i++) {
        color = getRandomColor();
        generateLegendEntry(domainsList[i].name,color);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, lastend, lastend + (Math.PI * 2 * (domainsList[i].frequency / totalFrequencies)), false);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.fill();
        lastend += Math.PI * 2 * (domainsList[i].frequency / totalFrequencies);

    }

}

function generateLegendEntry(name,color){
    var node = document.getElementById("pieLegend");
    var table = document.createElement("table");
    var row = document.createElement("tr");

    var colorTd = document.createElement("td");
    var colorDiv = document.createElement("div");
    colorDiv.setAttribute("style","width:15px; height:15px; background-color:"+color+";");
    colorTd.appendChild(colorDiv);

    var nameTd = document.createElement("td");
    var text = document.createTextNode(name);
    nameTd.appendChild(text);

    row.appendChild(colorTd);
    row.appendChild(nameTd);

    table.appendChild(row);

    node.appendChild(table);


}

triggerHistoryRepresentation();

setTimeout(function(){ drawPieByDomains(urls) }, 1000);
//setTimeout(function(){ getDomainsByUrls(urls) }, 1000);

