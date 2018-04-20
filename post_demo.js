function demo() {
    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "http://127.0.0.1:8888");
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send('{"request_type": "get_course_list", "token": "1050~sKxmKbHA0qNQSNqtCPKb87OZEHD6xg7TP574gBnYF6n8nKJ5h6sFQpQMbT4mqKh1"}');
    console.log(xmlhttp.responseText);
}
