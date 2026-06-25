# HCW School Management System (HCW-SMS)

HCW-SMS is an easy-to-use Student Information System for organizing student
information and school-related operations across K-12, trade schools, and higher
education, currently being modernized with a fresh React + [Mantine](https://mantine.dev)
UI (see [`frontend/`](frontend/)).

## Key Features

- Manage Student Data
- Manage Staff Data
- Manage School Data
- Course Manager
- Scheduling
- Attendance
- Grades
- Teacher Gradebook
- Progress Reports
- Report Cards
- Transcripts
- Built-in Communication
- Bulk data imports

## Installation

HCW-SMS requires:
- Apache 2.4 or above
- MySQL 5.7, 8.0 or MariaDB 10.4.x
- PHP 8.x

For local development, a Podman stack (Apache/PHP + MariaDB) is provided:

```bash
podman compose up -d --build
# open http://localhost:8080/   (runs the web installer on first launch)
```

## Attribution

HCW-SMS is based on **openSIS Classic Community Edition**, created by
[Open Solutions for Education, Inc. (OS4ED)](https://www.os4ed.com/). The original
project lives at [OS4ED/openSIS-Classic](https://github.com/OS4ED/openSIS-Classic).

## License

HCW-SMS, like openSIS, is released under the GNU General Public License (GPL)
version 2. The full license is included in [`docs/License.txt`](docs/License.txt)
and is also available [here](https://github.com/OS4ED/openSIS-Classic/blob/master/docs/License.txt).
