#!/usr/bin/python
# cron every 8 hours.
# 0 */8 * * * /usr/bin/python3 $HOME/songhill/backend/songhill/scripts/run_janitor.py

import os
import sys
from pathlib import Path

# Max file age = 30 minutes (1800 seconds).
MAX_FILE_AGE = 1800

file_cwd = os.path.realpath(os.path.dirname(__file__))
backend_path = Path(file_cwd).parent.parent.absolute()
songhill_path = f'{backend_path}/songhill'

sys.path.append(songhill_path)
from utils.janitor import Janitor

myJanitor = Janitor(f'{backend_path}/audio', MAX_FILE_AGE)
myJanitor.clean_old_files()
