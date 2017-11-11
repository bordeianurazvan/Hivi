var nodePositions = [];

function newRandomPosition(list){
    var rn = {};
    do{
        rn.coord_x = Math.floor(Math.random() * 1560)+50;
        rn.coord_y = Math.floor(Math.random() * 600)+50;
    }while(!checkPositions(list,rn));
    return rn;
}

function checkPositions(list,newPos){
    for(var i = 0; i < list.length; i++ ){
        if(Math.sqrt((newPos.coord_x - list[i].coord_x) * (newPos.coord_x - list[i].coord_x) +
                (newPos.coord_y - list[i].coord_y) * (newPos.coord_y - list[i].coord_y)) <=100){
            return false;
        }
    }
    return true;
}

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

function extractRootDomain(url) {
    var domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;


    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}

chrome.history.search({text: '', maxResults: 15}, function(data) {
    data.forEach(function(page) {

        var canvas = document.getElementById('myCanvas');
        var context = canvas.getContext('2d');
        var circlePosition = newRandomPosition(nodePositions);
        nodePositions.push(circlePosition);
        var centerX = circlePosition.coord_x;
        var centerY = circlePosition.coord_y;
        var radius = 40;

        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = 'green';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.stroke();

        context.font = "12px Arial";
        context.fillStyle = "black";
        context.textAlign = "center";
        context.fillText(extractRootDomain(page.url),circlePosition.coord_x,circlePosition.coord_y);


    });
});

console.log(nodePositions);