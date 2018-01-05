if (localStorage.getItem("hivi_data_source") === null) {
    localStorage.setItem("hivi_data_source","history");
}
if (localStorage.getItem("hivi_max_entries") === null) {
    localStorage.setItem("hivi_max_entries",50);
}
if (localStorage.getItem("hivi_blacklist_items") === null) {
    localStorage.setItem("hivi_blacklist_items",JSON.stringify({items : []}));
}