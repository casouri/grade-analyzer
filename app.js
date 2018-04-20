var xmlHttp = new XMLHttpRequest();
var token;
function login(){
    token = document.getElementsByName("username")[0].value;
    window.location.href = "http://127.0.0.1:8888/Course-Page.html";

}