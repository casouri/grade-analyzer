import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer

import calculator
import canvasapi
import log

CANVAS_URL = 'https://canvas.instructure.com'

# for development
logger = log.setupLog(__name__, 'info')

index_html_path = './index.html'

# with open('server-config.json') as file1:
#     config = json.load(file1)


class CustomCanvas(canvasapi.Canvas):
    """A custom class of canvas."""

    course_list_cache = None

    def _turncate_course_name(self, course_name):
        """Turncate long course name into shorter names.
        
        Takes the content before first comma,
        if there is no comma, take the first eight character.

        - Arguments
          - course_name (str): long course name.
        
        - Return
          - string: short course name.
        """
        # logger.debug('course_name type: %s', type(course_name))
        match = re.match('.+?(?=,)', course_name)
        if match:
            return match.group()
        else:
            return course_name[:9]

    def custom_get_course_string_list(self):
        """Get a list of names of current active courses.

        - Return
        - list<str>
        """
        return list(
            map(lambda course: self._turncate_course_name(str(course)),
                self.course_list))

    def __init__(self, *args, **kwargs):
        """Init."""
        super().__init__(*args, **kwargs)
        self.user = self.get_user('self')

    @property
    def course_list(self):
        """Get the current active courses from Canvas."""
        if self.course_list_cache:
            return self.course_list_cache
        else:
            return self.get_courses()

    def custom_get_grade_of_course(self, course):
        """Get a list of assignment objects for a course.

        - Argument
          - course (course object): the course.
        - Return
          - dict: the gradebook. see outline for detailed spec.

        """
        #
        # Group
        #

        assignment_group_list = course.list_assignment_groups()
        # key: group id in str
        # value: {other attributes}
        group_book = {}

        for group in assignment_group_list:
            group_book[str(group.id)] = {
                'name': group.name,
                'group_weight': group.group_weight,
                'rules': group.rules
            }

        #
        # Grading standard
        #

        # key: grading_standard_id in str
        # value: {grading standard}
        grading_standard_form = {}
        for standard in course.get_grading_standards():
            # it should be from F to A
            sorted_scheme = sorted(
                standard.grading_scheme, key=lambda spec: spec.get('value'))

            # key: name of letter grade in str
            # value: number of score
            # in normal scheme, each key's value is the lowest score of that letter.
            # in max_score_scheme, each key's value is the hignest score of that letter.
            # because this is how letter_grade is calculated in calculator.
            max_score_scheme = {}
            for index in range(0, len(sorted_scheme)):
                current_spec = sorted_scheme[index]
                if index < len(sorted_scheme) - 1:
                    next_spec = sorted_scheme[index + 1]
                else:
                    # when current spec is the last spec, should be A
                    next_spec = {'name': '', 'value': 100}

                max_score_scheme[current_spec['name']] = next_spec['value']

            grading_standard_form[str(standard.id)] = max_score_scheme

        #
        # Assignment
        #

        # key: assignment id in str
        # value: {other attribute}
        assignemnt_form = {}
        for assignment in course.get_assignments():
            assignemnt_form[str(assignment.id)] = {
                'name': assignment.name,
                'grade': assignment.get_submission(self.user).score,
                'display_grade': assignment.get_submission(self.user).score,
                'grading_type': assignment.grading_type,
                'grading_standard_id': assignment.grading_standard_id,
                'omit_from_final_grade': assignment.omit_from_final_grade,
                'points_possible': assignment.points_possible,
                'assignment_group_id': str(assignment.assignment_group_id)
            }
        return {
            'assignment': assignemnt_form,
            'assignment_group': group_book,
            'grading_standard': grading_standard_form
        }


class GARequestHandler(BaseHTTPRequestHandler):
    """A request handler for grade-analyzer server."""

    def _send_header(self):
        """Send header to client."""
        self.send_response(200)
        # self.send_header('Content-type', 'text/html')
        self.end_headers()

    def _send_json_header(self):
        """Send header to client for json data."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_GET(self):
        """Send index.html to client."""
        self._send_header()
        file_path = '.' + self.path
        if file_path == './':
            file_path = './index.html'
        with open(file_path, 'rb') as file1:
            text = file1.read()
            # self.wfile.write(bytes(message, 'utf8'))
            self.wfile.write(text)

    def _handle_post_request(self, request_form):
        """Hanles post request.
        
        - Arguments
          - request_form (dic): post data.
        
        - Return
          - list or dict: the data to be returned to client.
        
        - Exceptions
          - KeyError if the request_type is not found.
        """
        request_type = request_form['request_type']
        # type: calculate_final_grade
        # form: form
        # return: {'final_grade', 'max_final_grade'}
        if request_type == 'calculate_final_grade':
            grade_dict = calculator.calculate_final(request_form['form'])
            return_data = {
                'final_grade': grade_dict['grade'],
                'total_max_percent': grade_dict['total_max_percent'],
                'max_grade_dict': grade_dict['max_grade'],
                'group_weight_dict': grade_dict['group_weight']
            }

        # type: calculate_surplus_point
        # form: form
        # return: {'surplus_point', 'max_point'}
        elif request_type == 'calculate_surplus_point':
            surplus_point, max_point = calculator.calculate_surplus_point(
                request_form['form'])
            return_data = {
                'surplus_point': surplus_point,
                'max_point': max_point
            }

        # type: get_course_list
        # form: token
        elif request_type == 'get_course_list':
            canvas = CustomCanvas(CANVAS_URL, request_form['token'])
            return_data = canvas.custom_get_course_string_list()

        # type: get_grade_by_course
        # form: token, course_index
        elif request_type == 'get_grade_by_course':
            canvas = CustomCanvas(CANVAS_URL, request_form['token'])
            course_index = int(request_form['course_index'])
            # logger.debug('index type: %s', type(course_index))
            return_data = canvas.custom_get_grade_of_course(
                canvas.course_list[course_index])

        return return_data

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])

        # post data
        post_data = self.rfile.read(content_length)
        logger.debug('post_data: %s', post_data)
        try:
            request_form = json.loads(post_data)
            logger.debug('request_form: %s', request_form)
        except json.decoder.JSONDecodeError:
            logger.warning('Error when paring post data.')
            self.send_response(400)
            return

        # decide what to do
        try:
            return_data = self._handle_post_request(request_form)
        except KeyError as e:
            logger.warning('Wrong form from client: %s', e)
            self.send_response(400)
            return

        # send data back to client
        self._send_json_header()
        self.wfile.write(bytes(json.dumps(return_data), 'utf-8'))


def run_server(address, port):
    """Run server."""
    logger.info('starting server')
    server_address = (address, port)
    httpd = HTTPServer(server_address, GARequestHandler)
    httpd.serve_forever()


if __name__ == '__main__':
    run_server('127.0.0.1', 8888)

    # import yappi
    # yappi.start(builtins=True)

    # canvas = CustomCanvas(config['api_url'], config['token'])
    # course_list = canvas.course_list

    # grade_book = canvas.custom_get_grade_of_course(course_list[3])
    # # print(json.dumps(grade_book))

    # stats = yappi.get_func_stats()
    # stats.save('canvasapi.callgrind.prof', type='callgrind')
