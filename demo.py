import json

import calculator
from server import CustomCanvas

print('''
Welcom to CustomCanvas demo.
Enter number of the course to select that course,
and hit Return to get the grade book of that course.
''')

# load config
with open('server-config.json') as file1:
    config = json.load(file1)

canvas = CustomCanvas(config['api_url'], config['token'])
while True:
    # print courses
    index = 0
    for course in canvas.custom_get_course_string_list():
        print('{} => {}'.format(index, course))
        index += 1

    seleced_course_index = int(input('select course: '))
    course = canvas.course_list[seleced_course_index]

    # show grade book
    grade_book = canvas.custom_get_grade_of_course(course)
    if input('Show gradebook? [y/N] ') == 'y':
        print(json.dumps(grade_book, sort_keys=True, indent=2))

    if input('Show final? [y/N] ') == 'y':
        print(calculator.calculate_final(grade_book))

    if input('countinue? [y/N]: ') == 'y':
        pass
    else:
        break
