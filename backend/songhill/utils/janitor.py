import time
import os
import shutil

class Janitor(object):
  def __init__(self, working_dir, max_file_age):
    self.working_dir = working_dir
    self.file_in_dir = f'{working_dir}/in'
    self.file_out_dir = f'{working_dir}/out'
    self.max_file_age = max_file_age

  def get_age(self, path):
    current_time = os.stat(path).st_ctime
    return int(current_time)

  def purge(self, target_dir):
    if os.path.exists(target_dir):
      output_files_folders = os.listdir(target_dir)
      for file in output_files_folders:
        file_or_folder = f'{target_dir}/{file}'
        age = int(time.time()) - self.get_age(file_or_folder)
        if age > self.max_file_age and os.path.exists(file_or_folder):
          if os.path.isfile(file_or_folder):
            os.remove(file_or_folder)
          else:
            shutil.rmtree(file_or_folder, ignore_errors=True)

  def clean_old_files(self):
    current_in_secs = int(time.time())
    # Remove files in input directory.
    self.purge(self.file_in_dir)
    # Remove files or folders in output directory.
    self.purge(self.file_out_dir)
