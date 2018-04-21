
function login(){
    var token = document.getElementsByName("username")[0].value;
    window.location.href = "http://127.0.0.1:8888/Course-Page.html";
    localStorage.setItem("token", token);
}

function getCourses(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "http://127.0.0.1:8888");
    var token = localStorage.getItem("token");
    xmlHttp.send('{"request_type": "get_course_list", "token": "' + token + '"}');
    xmlHttp.onreadystatechange = function() {

        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          var courseArray = JSON.parse(xmlHttp.responseText);
            console.log(courseArray);
          var select = document.getElementById("courses");
            for(i=0; i<courseArray.length; i += 1){
            var option = document.createElement('option');
            option.text = courseArray[i];
            select.add(option);
            }
        }
    };

}
