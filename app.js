var i
const courseSelectID = 'courses'
window.courseUpdatedButNotSurplusTable = false

function login () {
  var token = document.getElementsByName('username')[0].value
  window.location.href = 'http://127.0.0.1:8888/course-page.html'
  window.localStorage.setItem('token', token)
}

function updateCourseSelect () {
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
  window.loadingNode = document.getElementById('load')
  window.loadingNode.innerHTML = 'loaded'
}

function getGrade () {
  window.loadingNode.innerHTML = 'loading'
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
      window.gradeBook = gradeBook

      window.courseUpdatedButNotSurplusTable = true
      updateGradeChange()
    }
  }
}

function updateGradeChange () {
  showGrade()
  // groupDict set here.
  updateFinalGradeAndDisplay()
  // the updateSurplusPoint is in callback of updateFinalGradeAndDisplay
  // bacause it needs AJAX to finish
  updatePredictionSelect()
}

function showGrade () {
  var gradeBook = window.gradeBook
  var table = document.getElementById('grade-book')
  var assignmentDict = gradeBook.assignment
  // {group id: {name, etc}}
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
  window.loadingNode.innerHTML = 'loaded'
}

function updateFinalGradeAndDisplay () {
  var xmlHttp = new window.XMLHttpRequest()
  xmlHttp.open('POST', 'http://127.0.0.1:8888')
  var postData = {'request_type': 'calculate_final_grade', 'form': window.gradeBook}
  xmlHttp.send(JSON.stringify(postData))

  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      var gradeDict = JSON.parse(xmlHttp.responseText)
      window.console.log(gradeDict)
      var finalGrade = gradeDict.final_grade
      window.console.log(finalGrade)
      var maxGradeDict = gradeDict.max_grade_dict
      var groupWeightDict = gradeDict.group_weight_dict
      window.console.log(maxGradeDict)
      window.console.log(groupWeightDict)
      // {'group name': max point of the group, etc}
      window.localStorage.setItem('groupDict', JSON.stringify(maxGradeDict))
      window.localStorage.setItem('groupWeightDict', JSON.stringify(groupWeightDict))
      window.localStorage.setItem('realFinalGrade', finalGrade * 100)
      window.totalMaxGrade = gradeDict.total_max_percent * 100
      window.console.log(gradeDict.total_max_percent)
      document.getElementById('final-grade').value = (finalGrade * 100).toString().slice(0, 5)
      // callback
      updateSurplusPoint()

    }
  }
}
function clearChildOf (node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function updatePredictionSelect () {
  var select = document.getElementById('grade-predict-select')
  clearChildOf(select)
  var gradeBook = window.gradeBook
  var assignmentGroupDict = gradeBook.assignment_group
  var assignmentGroupArray = Object.keys(assignmentGroupDict)
  for (var i = 0; i < assignmentGroupArray.length; i++) {
    var option = document.createElement('option')
    option.text = assignmentGroupDict[assignmentGroupArray[i]].name
    select.add(option)
  }
  select.selectedIndex = -1
}

function updateSurplusPoint () {
  var table = document.getElementById('surplus-point-table')
  // {groupname: maxscore}
  var stringGroupDict = window.localStorage.getItem('groupDict')
  var groupDict = JSON.parse(stringGroupDict)
  window.console.log(groupDict)
  var weightBook = window.localStorage.getItem('groupWeightDict')
  console.log(weightBook)
  weightBook = JSON.parse(weightBook)
  window.console.log(weightBook)

  var pointSpent = 0
  if (window.courseUpdatedButNotSurplusTable) {
    constructSurplusPointList(groupDict, table)
    window.courseUpdatedButNotSurplusTable = false
  } else {
    pointSpent = calculatePointAlreadySpent(groupDict, table, weightBook)
  }
  window.console.log(pointSpent)

  var finalGrade = document.getElementById('final-grade').value
  window.console.log('finalGrade: ', finalGrade)
  var remaindingPts = (parseFloat(window.localStorage.getItem('realFinalGrade')) - parseFloat(finalGrade) - pointSpent)
  remaindingPts = remaindingPts * window.totalMaxGrade / 100 // add the pts could lost before the plus sign
  document.getElementById('surplus-point-headline').innerHTML = 'Points You Can Lost: ' + remaindingPts.toString().slice(0, 4) + ' %'
  window.console.log('remaindingPts', remaindingPts)
  calculateLeftoverPoint(groupDict, table, weightBook, remaindingPts)
}

function calculateLeftoverPoint (groupDict, table, weightBook, remaindingPts) {
  var rowArray = table.rows
  for (i = 0; i < rowArray.length; i++) {
    var row = rowArray[i]
    var name = row.children[0].children[0].innerHTML
    window.console.log('weight: ', weightBook[name])
    window.console.log('max: ', groupDict[name])
    var leftover = remaindingPts / weightBook[name] * groupDict[name] / 80
    window.console.log('leftover: ', leftover)
    row.children[2].children[0].innerHTML = 'points with another ' + leftover.toString().slice(0, 4) + ' left'
  }
}

function calculatePointAlreadySpent (groupDict, table, weightBook) {
  window.console.log(weightBook)
  var rowArray = table.rows
  var totalPercent = 0
  for (i = 0; i < rowArray.length; i++) {
    var row = rowArray[i]
    var point = row.children[1].children[0].value
    window.console.log('point', point)
    var name = row.children[0].children[0].innerHTML
    window.console.log('name', name)
    var maxPointOfGroup = groupDict[name]
    window.console.log('maxPointOfGroup', maxPointOfGroup)
    if (maxPointOfGroup !== 0) {
      totalPercent += (point / maxPointOfGroup * weightBook[name])
    }
  }
  return (totalPercent * 100)
}

function constructSurplusPointList (groupDict, table) {
  clearChildOf(table)
  var keyArray = Object.keys(groupDict)
  window.console.log(keyArray)

  for (i = 0; i < keyArray.length; i++) {
    var row = document.createElement('tr')
    var nameTd = document.createElement('td')
    var inputTd = document.createElement('td')
    var leftoverTd = document.createElement('td')
    var name = document.createElement('P')
    name.innerHTML = keyArray[i]
    name.className = 'body inline'
    var input = document.createElement('INPUT')
    input.className = 'surplus'
    input.setAttribute('onchange', 'updateSurplusPoint()')
    var leftover = document.createElement('p')
    leftover.innerHTML = 'points with another 0 left'
    nameTd.appendChild(name)
    inputTd.appendChild(input)
    leftoverTd.appendChild(leftover)
    row.appendChild(nameTd)
    row.appendChild(inputTd)
    row.appendChild(leftoverTd)
    table.appendChild(row)
  }
}

function resetFinal () {
  document.getElementById('final-grade').value = window.localStorage.getItem('realFinalGrade')
}

function resetGradeBook () {
  var assignmentDict = window.gradeBook.assignment
  var assignmentKeyArray = Object.keys(assignmentDict)
  for (i = 0; i < assignmentKeyArray.length; i++) {
    assignmentDict[assignmentKeyArray[i]].display_grade = assignmentDict[assignmentKeyArray[i]].grade
  }
  window.gradeBook.assignment = assignmentDict
  showGrade()
  updateGradeChange()
}

function predictGrade () {
  var assumedPercent = parseFloat(document.getElementById('assumedGrade').value) / 100
  var index = document.getElementById('grade-predict-select').options.selectedIndex
  var groupName = document.getElementById('grade-predict-select').options[index].innerHTML

  // change gradebook
  var assignmentDict = window.gradeBook.assignment
  var assignmentKeyArray = Object.keys(assignmentDict)
  var groupDict = window.gradeBook.assignment_group
  for (i = 0; i < assignmentKeyArray.length; i++) {
    window.console.log('name in book: ', assignmentDict[assignmentKeyArray[i]].name)
    window.console.log('name to compare: ', groupName)
    var groupID = assignmentDict[assignmentKeyArray[i]].assignment_group_id
    var nameInBook = groupDict[groupID].name
    var assignment = assignmentDict[assignmentKeyArray[i]]
    if (nameInBook === groupName && assignment.grade === null) {
      assignment.display_grade = Math.round(assumedPercent * assignment.points_possible)
    }
  }
  window.gradeBook.assignment = assignmentDict
  showGrade()
  updateGradeChange()
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
  var finalGrade = document.getElementById('final-grade').value
  finalGrade = ''// enter the updated final grade here
}


function basic () {
  var button = document.getElementById('basic')
  if (button.value === 'basic') {
    var p = document.getElementsByTagName('P')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = 'Source Sans Pro, sans-serif'
    }
    var p = document.getElementsByTagName('INPUT')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = 'Source Sans Pro, sans-serif'
    }
    var p = document.getElementsByTagName('TR')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = 'Source Sans Pro, sans-serif'
    }
    var p = document.getElementsByTagName('div')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = 'Source Sans Pro, sans-serif'
    }
    document.getElementsByTagName('body')[0].style.background = 'white'
    document.getElementsByTagName('div')[0].style.background = 'white'
    document.getElementById('basic').value = 'cool'
  } else if (button.value === 'cool') {
    var p = document.getElementsByTagName('P')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = null
    }
    var p = document.getElementsByTagName('INPUT')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = null
    }
    var p = document.getElementsByTagName('TR')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = null
    }
    var p = document.getElementsByTagName('div')
    for (i = 0; i < p.length; i++) {
      p[i].style.fontFamily = null
    }
    document.getElementsByTagName('body')[0].style.background = 'linear-gradient(to right, #D3D3D3, #696969)'
    document.getElementsByTagName('div')[0].style.background = 'white'
    document.getElementById('basic').value = 'basic'
  }
}
