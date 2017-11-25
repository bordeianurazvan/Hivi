function newBlacklistItem(e){
    var url = document.getElementById("blacklistInputField").value;
    if(url){
        var x = document.createElement("tr");

        var y = document.createElement("td");
        y.innerHTML =  document.getElementById("blacklistInputField").value;


        var z = document.createElement("td");
        var v = document.createElement("button");
        v.setAttribute("id","blacklistElementRemove");
        v.innerHTML = "X";
        z.appendChild(v);

        x.appendChild(y);
        x.appendChild(z);
        document.getElementById("blacklistTable").appendChild(x);
    }
}

document.getElementById("blacklistInputTrigger").addEventListener("click",newBlacklistItem);