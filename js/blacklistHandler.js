var next_id = null;

function addNewBLEntry(value){
    var dataJSON = JSON.parse(localStorage["hivi_blacklist_items"]);
    dataJSON.items.push(value);
    localStorage["hivi_blacklist_items"] = JSON.stringify(dataJSON);
}

function newBlacklistItem(e){
    var url = document.getElementById("blacklistInputField").value;
    if(url){
        addNewBLEntry(url);
        generateBLEntry(document.getElementById("blacklistInputField").value,next_id++);
    }
}

function generateBLEntry(value,id){
    var x = document.createElement("tr");
    var y = document.createElement("td");
    var z = document.createElement("td");
    var v = document.createElement("button");
    y.innerHTML = value;
    y.setAttribute("style","float:left; padding-left:13px; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;");
    v.setAttribute("id","blacklistElementRemove"+id);
    v.innerHTML = "X";
    v.setAttribute("style","background:    #191919;\n" +
        "    color:         white;\n" +
        "    display:       inline-block;\n" +
        "    font:          10px \"Calibri\", sans-serif;\n" +
        "    text-align:    center;\n" +
        "    padding:1px 5px;\n" +
        "    margin:5px;");
    v.addEventListener("click",function(e){
        //remove entry
        var node = document.getElementById("blacklistElementRemove"+id);
        node.parentNode.parentNode.parentNode.removeChild(node.parentNode.parentNode);

        var dataJSON = JSON.parse(localStorage["hivi_blacklist_items"]);
        var index = dataJSON.items.indexOf(value);
        if (index > -1) {
            dataJSON.items.splice(index, 1);
        }
        localStorage["hivi_blacklist_items"]= JSON.stringify(dataJSON);
    });
    z.appendChild(v);
    x.appendChild(y);
    x.appendChild(z);
    document.getElementById("blacklistTable").appendChild(x);
    //add entry
}


function populateBlacklist(){
    var i=0;
    if(localStorage["hivi_blacklist_items"]!== null){
        var data = JSON.parse(localStorage["hivi_blacklist_items"]);
        for (i = 0; i < data.items.length; i++) {
            generateBLEntry(data.items[i],i);
        }
    }
    return i;
}

//init
populateBlacklist();

document.getElementById("blacklistInputTrigger").addEventListener("click",newBlacklistItem);