const courseSelectID = 'courses'

function login() {
  var token = document.getElementsByName('username')[0].value
  window.location.href = 'http://127.0.0.1:8888/Course-Page.html'
  window.localStorage.setItem('token', token)
}

function getCourses() {
  var courseTag = document.getElementById('id01')
  var xmlHttp = new XMLHttpRequest()
  xmlHttp.open('POST', 'http://127.0.0.1:8888')
  var token = window.localStorage.getItem('token')
  xmlHttp.send('{"request_type": "get_course_list", "token": "' + token + '"}')
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      var courseArray = JSON.parse(xmlHttp.responseText)
      window.console.log(courseArray)
      var select = document.getElementById(courseSelectID)
      for (var i = 0; i < courseArray.length; i++) {
        var option = document.createElement('option')
        option.text = courseArray[i]
        select.add(option)
      }
      // select the "Select a course" selection
      select.selectedIndex = 0
    }
  }
}

function getGrade() {
  var xmlHttp = new window.XMLHttpRequest()
  xmlHttp.open('POST', 'http://127.0.0.1:8888')
  var token = window.localStorage.getItem('token')
  // - 1 because ther is a "Select a course" selection
  var courseIndex = document.getElementById(courseSelectID).selectedIndex - 1
  if (courseIndex < 0) {
    window.console.log('Error: no course selected')
    return
  }
  xmlHttp.send('{"request_type": "get_grade_by_course", "token": "' + token + '", ' + '"course_index": "' + courseIndex + '"}')
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      window.console.log(xmlHttp.responseText)
      var gradeBook = JSON.parse(xmlHttp.responseText)
      window.console.log(gradeBook)
      window.localStorage.setItem('gradeBook', xmlHttp.responseText)
      showGrade()
    }
  }
}

function getGradeBook() {
  return JSON.parse(window.localStorage.getItem('gradeBook'))
}

function showGrade() {
  var gradeBook = getGradeBook()
  var table = document.getElementById('assignment-table')
  var assignmentDict = gradeBook.assignment
  var assignmentGroupDict = gradeBook.assignment_group
  var assignmentKeyList = Object.keys(assignmentDict)
  // clean table
  for (var i = table.rows.length - 1; i > 0; i--) {
    table.deleteRow(i)
  }
  for (var i = 0; i < assignmentKeyList.length; i++) {
    var assignment = assignmentDict[assignmentKeyList[i]]
    var groupName = assignmentGroupDict[assignment.assignment_group_id].name
    var row = table.insertRow(-1)
    var nameCell = row.insertCell(0)
    var gradeCell = row.insertCell(1)
    var groupCell = row.insertCell(2)
    nameCell.innerHTML = assignment.name
    gradeCell.innerHTML = assignment.display_grade
    groupCell.innerHTML = groupName
  }
}

function showFinalGrade() {
  var xmlHttp = new window.XMLHttpRequest()
  xmlHttp.open('POST', 'http://127.0.0.1:8888')

}

function getFinalGrade() {
  var finalGrade = document.getElementById("finalGrade").value;
  var remaindingPoints;
  remaindingPoints = + '%'; //add the pts could lost before the plus sign

  remaindingPts = document.getElementById("id08");
  remaindingPts.innerHTML = remaindingPoints;

  quiz = document.getElementById("quiz");
  quiz.innerHTML = //here is the max possible pts to lose for quiz

    homework = document.getElementById("homework");
  homework.innerHTML = //here is the max possible pts to lose for homework

    test = document.getElementById("test");
  test.innerHTML = //here is the max possible pts to lose for test
}


