document.getElementById("save").addEventListener("click",function(e){
    if(document.getElementById("history").checked) {
        localStorage["hivi_data_source"] = "history";
        alert("Data source was changed to History")
    } else if(document.getElementById("bookmarks").checked) {
        localStorage["hivi_data_source"] = "bookmarks";
        alert("Data source was changed to Bookmarks")
    } else if(document.getElementById("pocket").checked) {
        getPocket();
    }

});

