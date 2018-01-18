function getPocket() {

    var __request_code;
    var __access_token_string;

    function fetch_data() {
        xmlhttp = make_xmlhttprequest("POST", "https://getpocket.com/v3/get", true);
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState === 4) {

                if (xmlhttp.status === 200) {
                    var result = JSON.parse(xmlhttp.responseText);
                    localStorage['hivi_pocket'] = JSON.stringify(result.list);
                }
            }
        };
        xmlhttp.send("consumer_key=" + consumer_key + "&" + __access_token_string + "&" + "count=10" + "&" + "detailType=simple");
    }


    function get_redirect_url() {
        return chrome.identity.getRedirectURL();
    }

//TODO place your pocket consumer key here
    function get_pocket_consumer_key() {
        return "73604-c88e7eb9ee13fed7deff2d21";
    }

    function make_xmlhttprequest(method, url, flag) {
        xmlhttp = new XMLHttpRequest();
        xmlhttp.open(method, url, flag);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        return xmlhttp
    }

    function get_request_code(consumer_key) {
        redirect_url = get_redirect_url();
        xmlhttp = make_xmlhttprequest('POST', 'https://getpocket.com/v3/oauth/request', true);
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState === 4) {
                if (xmlhttp.status === 200) {
                    request_code = xmlhttp.responseText.split('=')[1];
                    __request_code = request_code;
                    lauch_chrome_webAuthFlow_and_return_access_token(request_code);
                }
            }
        };
        xmlhttp.send("consumer_key=" + consumer_key + "&redirect_uri=" + redirect_url);

    }

    function get_access_token() {
        xmlhttp = make_xmlhttprequest('POST', 'https://getpocket.com/v3/oauth/authorize', true);
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                access_token_string = xmlhttp.responseText.split('&')[0];
                __access_token_string = access_token_string;
                fetch_data();
            }
        };
        xmlhttp.send("consumer_key=" + consumer_key + "&code=" + request_code);
    }

    function lauch_chrome_webAuthFlow_and_return_access_token(request_code) {
        redirect_url = get_redirect_url();
        chrome.identity.launchWebAuthFlow(
            {
                'url': "https://getpocket.com/auth/authorize?request_token=" + request_code + "&redirect_uri=" + redirect_url,
                'interactive': true
            },
            function (redirect_url) {
                //Get access token
                get_access_token(consumer_key, request_code);
            });

    }

    function import_my_chrome_bookmarks() {
        consumer_key = get_pocket_consumer_key();
        get_request_code(consumer_key);

    }


        import_my_chrome_bookmarks();


}