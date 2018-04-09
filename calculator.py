import log

logger = log.setupLog(__name__, 'info')


class AssignmentGroup:
    """A group of assignment that have the same grade weight."""

    def __init__(self, name, weight, rule_list, grading_standard):
        """Init."""
        self.name = name
        self.weight = weight
        self.assignment_list = []
        # a number to drop
        self.drop_lowest = rule_list.get('drop_lowest')
        # a number to drop
        self.drop_highest = rule_list.get('drop_highest')
        # a list contains ids of assignments that should never drop
        self.never_drop = rule_list.get('never_drop')
        self.grading_standard = grading_standard

    def calculate_final_grade(self):
        """Calculate the overall grade to final.

        - Return
          tuple: (final_grade, final_possible_grade) final_grade
          is the total valid points x group weight. final_possible_grade
          is the max grade x group weight.
        """
        non_nil_assignment_list = []
        for assignment in self.assignment_list:
            if assignment['display_grade']:
                non_nil_assignment_list.append(assignment)

        # sort assignments from lowest to hignset grade
        # by display_grade
        sorted_assignment_list = sorted(
            non_nil_assignment_list, key=lambda assg: assg['display_grade'])

        # handles dropping
        if self.drop_lowest:
            dropped = 0
            index = 0
            while dropped < self.drop_lowest:
                if sorted_assignment_list[index] not in self.never_drop:
                    sorted_assignment_list.pop(index)
                    dropped += 1
                    index += 1
                # don't inrease index if we popped an item
        if self.drop_highest:
            while dropped < self.drop_highest:
                if sorted_assignment_list[-index] not in self.never_drop:
                    sorted_assignment_list.pop(-index)
                    dropped += 1
                    index += 1
                # don't inrease index if we popped an item

        total_grade = 0
        total_possible_grade = 0
        # sum up total grade
        for assignment in sorted_assignment_list:
            if assignment['omit_from_final_grade']:
                continue
            else:
                # handle different grading types
                # TODO handle other types
                grading_type = assignment['grading_type']
                if grading_type == 'points':
                    total_grade += assignment['display_grade']
                    total_possible_grade += assignment['points_possible']
                elif grading_type in ['percent', 'percentage']:
                    total_grade += assignment['display_grade'] * assignment[
                        'points_possible']
                    total_possible_grade += assignment['points_possible']
                elif grading_type == 'pass_fail':
                    if assignment['display_grade'] in ['pass', 'complete']:
                        total_grade += assignment['points_possible']
                        total_possible_grade += assignment['points_possible']
                    elif assignment['display_grade'] in ['fail', 'incomplete']:
                        total_possible_grade += assignment['points_possible']
                    else:
                        logger.error(
                            'wrong grade type/value type: {} value: {}'.format(
                                grading_type, assignment['display_grade']))
                elif grading_type == 'letter_grade':
                    if not self.grading_standard:
                        logger.error(
                            'letter grade given but not grading_standard')
                    else:
                        total_grade += self.grading_standard[assignment[
                            'display_grade']] * assignment[
                                'points_possible'] / 100
                        total_possible_grade += assignment['points_possible']

        final_grade = total_grade * self.weight / 100
        final_possible_grade = total_possible_grade * self.weight / 100
        return (final_grade, final_possible_grade)

    def add_assignment(self, assignment):
        """Add an assignment to assignment group.

        - Arguments
          - assignment (dict): It should have the same form of an assignment
            in grade book presented in outline.org.
            For example, {
            "assignment_group_id": 10500000002804449,
            "display_grade": 82.0,
            "grade": 82.0,
            "grading_standard_id": null,
            "grading_type": "percent",
            "name": "Roll Call Attendance",
            "omit_from_final_grade": true,
            "points_possible": 100.0
            }
        - Note
          - display grade will be calculated.
          - assignments will have one extra entry: id, which is the key of assignment
            in original form returned from canvasapi.
        """
        self.assignment_list.append(assignment)


def calculate_final(form):
    """Calculate final grade base on current gradebook.

    - Arguments:
    - form (dict): gradebook. Detailed spec in ./outline.org.

    - Return:
    - tuple: (final_grade, final_possible_grade).
      final_grade and final_possible_grade are float.
      final_grade/final_possible_grade is the percent grade.
    """
    # create assignment groups
    assignment_group_book = {}
    for group_id in form['assignment_group']:
        group = form['assignment_group'][group_id]

        if group.get('grading_standard_id'):
            grading_standard = form['grading_standard'][str(
                group['grading_standard_id'])]
        else:
            grading_standard = None

        assignment_group_book[group_id] = AssignmentGroup(
            group['name'], group['group_weight'], group['rules'],
            grading_standard)

    # separate assginments into groups
    for assignment_key in form['assignment']:
        assignment = form['assignment'][assignment_key]
        assignment['id'] = assignment_key
        group = assignment_group_book[str(assignment['assignment_group_id'])]
        group.add_assignment(assignment)

    # calculate final grade
    final_grade = 0
    final_possible_grade = 0
    for group_key in assignment_group_book:
        group = assignment_group_book[group_key]
        grade, max_grade = group.calculate_final_grade()
        final_grade += grade
        final_possible_grade += max_grade

    return (final_grade, final_possible_grade)


def calculate_surplus_point(form, target_final):
    """Calculate the surplus points given current grade and a target final grade.

    - Argument
      - form (dict): gradebook. Detailed spec in ./outline.org.
      - target_final (float): desired final grade in percent.

    - Return
      float: number of points that can be lost
      while still maintain target final grade
    """


if __name__ == '__main__':
    import json
    with open('tmp_gradebook.json') as file1:
        form = json.load(file1)
    print(calculate_final(form))
