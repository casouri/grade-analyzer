from http.server import BaseHTTPRequestHandler, HTTPServer

import log

# for development
logger = log.setupLog(__name__, 'info')

index_html_path = './index.html'


class GARequestHandler(BaseHTTPRequestHandler):
    """A request handler for grade-analyzer server."""

    def _send_header(self):
        "Send header to client."
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        """Send index.html to client."""
        self._send_header()

        with open(index_html_path, 'r') as file1:
            text = file1.read()
            # self.wfile.write(bytes(message, 'utf8'))
            self.wfile.write(bytes(text, 'utf8'))


def run_server(address, port):
    logger.info('starting server')
    server_address = (address, port)
    httpd = HTTPServer(server_address, GARequestHandler)
    httpd.serve_forever()


if __name__ == '__main__':
    run_server('127.0.0.1', 8888)
