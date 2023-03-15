import gc
import glob
import json
import logging
import os
import psutil
import re
import shutil
import uuid
import threading

import magic
from django.conf import settings
from django.core.files.storage import default_storage
from django.http import Http404, HttpResponse, JsonResponse
from django.middleware import csrf
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from pydub import AudioSegment
from spleeter.separator import Separator
from .utils.janitor import Janitor

########
# Vars #
########

LOG = logging.getLogger(__name__)

MY_LOGGER_ACTIVE = False
# Max file size = 200 megabytes.
MAX_FILE_SIZE = 200000000
# Max file age = 30 minutes (1800 seconds).
MAX_FILE_AGE = 1800
# Wait for CPU to be less than MAX_CPU_MEM_PERC before proceeding with processing.
MAX_CPU_MEM_PERC = 80
ERROR_REASON = ''
CONVERT_TO_MP3 = True
DELETE_OUTPUT_DIR = False
STEM_EXT = 'mp3'
STEM_TYPE = 'audio/mpeg'
PROJECT_PATH = settings.BASE_DIR

file_cwd = PROJECT_PATH
file_in_dir = f'{file_cwd}/audio/in/'
file_out_dir = f'{file_cwd}/audio/out/'
file_in = ''

###########
# Methods #
###########

def myLogger(text):
  if MY_LOGGER_ACTIVE:
    log_txt = f'SONGHILL: {text}'
    return print(log_txt)

def is_file_valid(file_in):
  valid_file = False
  if os.path.isfile(file_in):
    file_size = os.path.getsize(file_in)
    file_magic = magic.Magic(mime=True)
    file_type = file_magic.from_file(file_in)
    valid_file_types = ['audio/', '/ogg']
    if file_size <= MAX_FILE_SIZE:
      if any(type in file_type for type in valid_file_types):
        ERROR_REASON = 'Invalid size or file type.'
        valid_file = True
  return valid_file

def process_file_name(file_name, uuid):
  # Remove everything except numbers and letters.
  cleaned = re.sub(r"[^\w\s]", '_', file_name)
  # Replace all runs of whitespace with an underscore.
  cleaned = re.sub(r"\s+", '_', cleaned)
  formatted = f'{uuid}_{file_name}'.replace(' ', '_')
  return formatted

def delete_input_file(file_in):
  # Delete uploaded input file.
  myLogger('Deleting input file')
  if os.path.exists(file_in):
    os.remove(file_in)

def delete_output_dir(audio_output_dir):
  # Remove output dir if zip file exists.
  myLogger('Deleting output directory')
  zip_file = f'{audio_output_dir}.zip'
  if os.path.exists(zip_file) and os.path.exists(audio_output_dir):
    shutil.rmtree(audio_output_dir)

def return_file(request, contentType = "application/zip"):
  # Allow 'request' to be a string. Otherwise it is a normal request object.
  if isinstance(request, str):
    file_name = request
  else:
    file_name = request.GET.get('filename')
  file_path = f'{file_out_dir}{file_name}'
  if os.path.exists(file_path):
    with open(file_path, 'rb') as fh:
      response = HttpResponse(fh.read(), content_type=contentType)
      response['Content-Disposition'] = 'attachment; filename=' + os.path.basename(file_path)
      return response
  raise Http404


#############
# Endpoints #
#############

cpu_mem_available = threading.Event()

def wait_for_cpu():
  cpu_perc = round(psutil.cpu_percent())
  mem_perc = round(psutil.virtual_memory().percent)
  cpu_mem_available.clear()
  if cpu_perc < MAX_CPU_MEM_PERC and mem_perc < MAX_CPU_MEM_PERC:
    cpu_mem_available.set()

def handle_processing_exception(error, file_in, audio_output_dir):
  myLogger('Processing error')
  if os.path.exists(file_in):
    delete_input_file(file_in)
  if os.path.exists(audio_output_dir):
    shutil.rmtree(audio_output_dir)
  LOG.error(str(error))
  gc.collect()
  return JsonResponse({'error': str(error)})

@csrf_exempt
@require_http_methods(['POST'])
def process(request):
  if request.method == 'POST':
    spleeting_complete = False
    status_text = ''
    uuid = request.POST.get('uuid')
    stem_type = request.POST.get('type')
    audio_file = request.FILES['file']
    file_name_orig = audio_file.name
    file_name = process_file_name(file_name_orig, uuid)
    file_full_path = file_in_dir+file_name

    # Save uploaded file.
    if os.path.exists(file_full_path):
      os.remove(file_full_path)
    default_storage.save(file_full_path, audio_file)
    file_in = file_full_path
    file_name_no_ext = os.path.splitext(file_name)[0]
    audio_output_dir = f'{file_out_dir}{file_name_no_ext}'

    # Process audio and save stems.
    myLogger('Waiting on CPU')
    thread = threading.Thread(target=wait_for_cpu)
    thread.start()
    cpu_mem_available.wait()

    try:
      file_valid = is_file_valid(file_in)
      if file_valid:
        myLogger('Spleeting begins')
        Separator(f'spleeter:{stem_type}stems').separate_to_file(file_in, file_out_dir)
        spleeting_complete = True
    except Exception as error:
      handle_processing_exception(error, file_in, audio_output_dir)

    # Convert wav files to mp3.
    try:
      if CONVERT_TO_MP3 and spleeting_complete and os.path.exists(audio_output_dir):
        wav_files = glob.glob(f'{audio_output_dir}/*.wav')
        for wav_file in wav_files:
          if os.path.exists(wav_file):
            stem_file = f"{wav_file.replace('.wav','')}.{STEM_EXT}"
            AudioSegment.from_wav(wav_file).export(stem_file, format=STEM_EXT)
            if os.path.exists(stem_file):
              os.remove(wav_file)

      output_stems = os.listdir(audio_output_dir)
      status_text = 'complete'

      if DELETE_OUTPUT_DIR:
        delete_output_dir(audio_output_dir)
      delete_input_file(file_in)

      response = {
        "status": status_text,
        "dirname": file_name_no_ext,
        "uuid": uuid,
        "exception": ERROR_REASON
      }
      if not DELETE_OUTPUT_DIR:
        response['stems'] = output_stems

      return JsonResponse(response)
    except Exception as error:
      handle_processing_exception(error, file_in, audio_output_dir)


# Provision the session.
@require_http_methods(['GET'])
def provision(request):
  janitor = Janitor(f'{file_cwd}/audio', MAX_FILE_AGE)
  janitor.clean_old_files()
  json = {
    "csrftoken": csrf.get_token(request),
    # Generate simple 8 character uuid.
    "uuid": str(uuid.uuid4())[:8]
  }
  response = JsonResponse(json)
  response.set_cookie(key='uuid', value=json['uuid'], max_age=None)
  return response

# Download individual stem file.
@require_http_methods(['GET'])
def stem(request):
  return return_file(request, STEM_TYPE)

# Download all as zip.
@require_http_methods(['GET'])
def zip(request):
  # Create zip file.
  filename = request.GET.get('filename')
  audio_output_dir = f'{file_out_dir}{filename}'
  zip_filename = f'{filename}.zip'
  zip_fullpath = f'{audio_output_dir}.zip'
  if not os.path.exists(zip_fullpath):
    zip_fullpath = shutil.make_archive(audio_output_dir, 'zip', audio_output_dir)
    zip_filename = zip_fullpath.split('/').pop()

  return return_file(zip_filename, "application/zip")

# Remove any session files.
@csrf_exempt
@require_http_methods(['POST'])
def purge(request):
  if request.method == 'POST':
    try:
      files = glob.glob(f'{file_cwd}/audio/*/{request.POST.get("uuid")}*')
      for file in files:
        if os.path.exists(file) and os.path.isfile(file):
          os.remove(file)
        elif os.path.exists(file) and os.path.isdir(file):
          shutil.rmtree(file)

      return JsonResponse({'status': 'cleaned'})
    except Exception as error:
      myLogger(f'Purge error: {error}')
      return JsonResponse({'status': 'error'})
