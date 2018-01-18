document.getElementById("save").addEventListener("click",function(e){
    if(document.getElementById("history").checked) {
        localStorage["hivi_data_source"] = "history";
    } else if(document.getElementById("bookmarks").checked) {
        localStorage["hivi_data_source"] = "bookmarks";
    } else if(document.getElementById("pocket").checked) {
        getPocket();
        localStorage["hivi_data_source"] = "pocket";
    }
    var value = document.getElementById("linksNumber").value;
    if(value.length !==0){
        try{
            if(value >= 1 && value <= 30) {
                localStorage["hivi_max_entries"] = value;
            }
        } catch(err){

        }

    }
});

