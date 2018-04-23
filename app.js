var i
const courseSelectID = 'courses'

function login () {
  var token = document.getElementsByName('username')[0].value
  window.location.href = 'http://127.0.0.1:8888/course-page.html'
  window.localStorage.setItem('token', token)
}

function getCourses () {
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

function getGrade () {
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

function getGradeBook () {
  return JSON.parse(window.localStorage.getItem('gradeBook'))
}

function showGrade () {
  var gradeBook = getGradeBook()
  var table = document.getElementById('grade-book')
  var assignmentDict = gradeBook.assignment
  var assignmentGroupDict = gradeBook.assignment_group
  var assignmentKeyList = Object.keys(assignmentDict)
  // clean table
  for (i = table.rows.length - 1; i > 0; i--) {
    table.deleteRow(i)
  }
  for (i = 0; i < assignmentKeyList.length; i++) {
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
  updateFinalGradeAndDisplay()
}

function updateFinalGradeAndDisplay () {
  var xmlHttp = new window.XMLHttpRequest()
  xmlHttp.open('POST', 'http://127.0.0.1:8888')
  var postData = {'request_type': 'calculate_final_grade', 'form': getGradeBook()}
  xmlHttp.send(JSON.stringify(postData))

  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      var gradeDict = JSON.parse(xmlHttp.responseText)
      window.console.log(gradeDict)
      var finalGrade = gradeDict.final_grade
      window.console.log(finalGrade)
      var maxGradeDict = gradeDict.max_grade_dict
      window.console.log(maxGradeDict)
      // {'group name': max point of the group, etc}
      window.localStorage.setItem('groupDict', maxGradeDict)
      window.localStorage.setItem('realFinalGrade', finalGrade * 100)
      document.getElementById('finalGrade').value = (finalGrade * 100).toString().slice(0, 5)
    }
  }
}
function clearChildOf (node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function updateSurplusPoint () {
  var finalGrade = document.getElementById('finalGrade').value
  var remaindingPts = (window.localStorage.getItem('realFinalGrade') - parseFloat(finalGrade)).toString().slice(0, 4) + ' %' // add the pts could lost before the plus sign
  document.getElementById('id09').innerHTML = 'Total surplus point: ' + remaindingPts
  window.console.log(remaindingPts)

  var divElement = document.getElementById('id10')
  clearChildOf(divElement)
  var groupDict = window.localStorage.getItem('groupDict')
  var keyArray = Object.keys(groupDict)

  // for (i = 0; keyArray.length; i++) {
  //   var form = document.createElement('FORM')
  //   var name = document.createElement('P')
  //   var inputNode = document.createElement('INPUT')
  //   name.value = keyArray[i]
  //   form.appendChild(name)
  //   form.appendChild(inputNode)
  //   divElement.appendChild(form)
  // }
}

function getImage () {
  var quizPoints = document.getElementById('quiz').value
  var homeworkPoints = document.getElementById('homework').value
  var testPoints = document.getElementById('test').value

  var remaindingPts
  remaindingPts = +'%' // add the pts could lost before the plus sign
  remainding = document.getElementById('remainding')
  remainding.innerHTML = remaindingPts

  var quizPts
  quizPts = '' // add the max possible pts to lose for quiz
  quiz = document.getElementById('quiz')
  quiz.innerHTML = quizPts

  var homeworkPts
  homeworkPts = '' // add the max possible pts to lose for homework
  homework = document.getElementById('homework')
  homework.innerHTML = homeworkPts

  var testPts
  testPts = '' // add the max possible pts to lose for test
  test = document.getElementById('test')
  test.innerHTML = testPts

  var pieChart
  pieChart = '<img' + '' + ' >' // add the image in the quotes
  image = document.getElementById('image')
  image.innerHTML = pieChart
}

function getFinalReport () {
  var assumedScore = document.getElementById('assumedGrade').value
  var pickGroup = document.getElementById('pickGroup').value
  var finalGrade = document.getElementById('finalGrade').value
  finalGrade = ''// enter the updated final grade here
}


