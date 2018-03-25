import logging
import sys

levelBook = {
    'debug': logging.DEBUG,
    'info': logging.INFO,
    'error': logging.ERROR,
    'warning': logging.WARNING,
    'critical': logging.CRITICAL
}


def setupLog(name, level):
    level = levelBook[level]
    rootLogger = logging.getLogger(name)
    rootLogger.setLevel(logging.DEBUG)

    stdoutHandler = logging.StreamHandler(sys.stdout)
    stdoutHandler.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        '%(asctime)s :: %(name)s :: %(levelname)s :: %(message)s')
    stdoutHandler.setFormatter(formatter)
    rootLogger.addHandler(stdoutHandler)

    return rootLogger
