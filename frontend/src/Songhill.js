import { useEffect, useState } from 'react'
import axios from 'axios'
import logo from './images/songhill-logo.webp'
import play_icon from './images/play.png'
import './Songhill.css'

function Songhill() {
  let fileData = {};

  // 15 minutes.
  const SESSION_TIME = 900000;
  // 200 megabytes.
  const MAX_FILESIZE = 200000000;
  const MAX_FILESIZE_MB = MAX_FILESIZE/1000000;
  const STEM_EXT = '.mp3';
  const STEM_TYPE = 'audio/mpeg';
  const mailto = 'mailto:songhill.com@gmail.com';
  const leaveConfirmTxt = 'This session will be lost. Do you want to start over?';

  const [ internalError, setInternalError ] = useState(false);
  const [ uuid, setUuid ] = useState();
  const [ csrftoken, setCsrftoken ] = useState();
  const [ errorTxt, setErrorTxt ] = useState();
  const [ completedMarkup, setCompletedMarkup ] = useState('');
  const [ statusTxt, setStatusTxt ] = useState();
  const [ submitBtnDisabled, setSubmitBtnDisabled ] = useState(false);

  let PRODMODE = true;
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    PRODMODE = false;
  }
  // const SHOW_ADS = document.location.hostname.includes('songhill.com');
  const SHOW_ADS = false;

  const API_PATH_SET = process.env.REACT_APP_API_PATH ? process.env.REACT_APP_API_PATH : '/api';
  const API_PATH = PRODMODE ? API_PATH_SET : '';

  const byId = (id) => {
    return document.getElementById(id);
  }

  const Dots = () => {
    return (<span className="dots">
      <span>.</span><span>.</span><span>.</span>
    </span>)
  }

  const ErrorCommon = () => {
    return (<div>
      <div>An error has occurred.</div>
      <div>Please <a href="/">reload</a> and try again.</div>
    </div>)
  }

  const showError = () => {
    byId('form-process').style.display = 'none';
    setErrorTxt(ErrorCommon);
  }

  // Only run provisionUser once during load of page.
  // Remove the empty array to apply with every page update.
  useEffect(() => {
    window.scroll(0,0);
    fetch(`${API_PATH}/provision`)
    .then((response) => response.json())
    .then(data => {
      // eslint-disable-next-line
      setCsrftoken(data.csrftoken);
      setUuid(data.uuid);
    })
    .catch(() => {
      setInternalError(true);
      return;
    })

    if (internalError) {
      byId('form-process').style.display = 'none';
      setErrorTxt(ErrorCommon);
    }
  }, [internalError, API_PATH])

  const downloadFile = (path, filename) => {
    fetch(`${API_PATH}/${path}?filename=${filename}`)
    .then((response) => response.blob())
    .then((data) => {
      var anchor = document.createElement("a");
      anchor.href = window.URL.createObjectURL(data);
      anchor.download = filename;
      anchor.click();
    })
    .catch(function() {
      showError();
    })
  }

  const showErrorTxt = () => {
    byId('error-txt').style.display = 'block';
    byId('form-process').scrollIntoView(true);
  }

  const showFileSelectError = () => {
    showErrorTxt();
    setErrorTxt(<div>Please select an audio file. <div className='small-txt'>e.g., mp3, wav, ogg, flac, etc.</div></div>);
  }

  const handleFileAdd = (e) => {
    const audio_file = e.target.files[0];
    // Supported content types.
    const valid_types = ['audio/', '/ogg'];
    const is_audio_file = valid_types.some(type => audio_file.type.includes(type));
    // Check file size.
    const is_size_valid = audio_file.size <= MAX_FILESIZE;
    if (!is_audio_file || !is_size_valid) {
      showErrorTxt();
      byId('process_button').className = 'btn-disabled';
      setSubmitBtnDisabled(true);
    }
    if (!is_audio_file) {
      showFileSelectError();
    }
    if (!is_size_valid) {
      setErrorTxt(`Maximum file size is ${MAX_FILESIZE_MB} megabytes.`);
    }
    if (e.target.value && is_audio_file) {
      byId('error-txt').style.display = 'none';
      byId('process_button').className = '';
      setSubmitBtnDisabled(false);
    }
  }

  const stemPlay = (e, filename) => {
    fetch(`${API_PATH}/stem?filename=${filename}`)
    .then((response) => response.blob())
    .then((data) => {
      const filename_only = filename.split('/')[1].replace(STEM_EXT,'');
      const now_playing = `Now playing: ${filename_only}`;
      byId('audio_player').style.display = 'block';
      byId('audio_player').src = window.URL.createObjectURL(data);
      byId('audio_player').title = now_playing;
      byId('audio_player').load();
      byId('audio_player').play();
      byId('status-txt').innerText = now_playing;
    })
    .catch(function() {
      showError();
    })
  }

  const AudioPlayer = () => {
    return (<audio id="audio_player" src="" type={STEM_TYPE} controls />);
  }

  const StemRows = ({data}) => {
    const stem_dir = data.dirname;
    const stem_rows = data.stems.map((stem) => {
      const stem_name = stem.replace(STEM_EXT, '');
      return (<div className='stem' key={stem}>
        <span className='stem_name'>{stem_name}</span>
        <div className='btns'>
          <button className="btn play" onClick={(e) => stemPlay(e, `${stem_dir}/${stem}`)} title='Play'><img alt="Play" src={play_icon} className="play_icon" /></button>
          <button className="btn download" onClick={() => downloadFile('stem', `${stem_dir}/${stem}`)} title='Download'>Download</button>
        </div>
      </div>)
    })
    return (
      <div className='stems'>{stem_rows}</div>
    )
  }

  const sessionCountdown = () => {
    let time_left = SESSION_TIME;
    let timer = setInterval(() => {
      if (time_left <= 0) {
        window.onbeforeunload = () => {}
        clearInterval(timer);
        purgeFiles();
        byId('error-txt').style.display = 'block';
        byId('status-txt').style.display = 'none';
        byId('completed').style.display = 'none';
        setErrorTxt(<div>Your session has expired. Please <button className="btn-link" onClick={() => pageResetConfirmed()}>try again</button>.</div>);
      } else {
        time_left = time_left - 1000;
      }
    }, 1000)
  }

  const handlePageError = (error) => {
    window.onbeforeunload = () => {};
    purgeFiles();
    byId('icon-process').className = 'songhill-logo';
    if (error) {
      byId('error-txt').style.display = 'block';
      const error_txt = `${uuid} - ${error}`;
      const email_link = `${mailto}?subject=Error Report: ${error_txt}`;
      setErrorTxt(<div>
        <div>An error has occurred.</div>
        <div>Please <button className="btn-link" onClick={() => pageResetConfirmed()}>try again</button> or <a href={email_link}>contact us</a>.</div>
      </div>);
      setStatusTxt(<div className='smaller-txt error-box'>{error_txt}</div>);
    }
  }

  const pageProcessComplete = (response) => {
    byId('completed').style.display = 'block';
    byId('icon-process').className = 'songhill-logo';
    if (response.data.status === 'complete') {
      byId('status-txt').scrollIntoView();
      setStatusTxt(`Processing ${response.data.status}!`);
      sessionCountdown();
      setCompletedMarkup(<div>
        <StemRows data={response.data} />
        <button className="btn" onClick={() => downloadFile('zip', response.data.dirname)} title="Download all files as a zip file.">Download all files</button>
        <div className="small-txt"><button className="btn-link" onClick={() => pageReset()}>Process new audio</button></div>
      </div>);
    } else {
      handlePageError(response.data.error);
    }
  }

  const pageInProgress = () => {
    window.onbeforeunload = (e) => { return leaveConfirmTxt };
    window.scroll(0,0);
    setStatusTxt(<div>
      <div className="processing-txt">Now processing <div>your audio tracks.<Dots /></div></div>
      <div className="small-txt"><button className="btn-link" onClick={() => pageReset(true)}>Cancel Processing</button></div>
    </div>);
    byId('status-txt').style.display = 'block';
    byId('icon-process').className = 'songhill-logo-anim';
    byId('form-process').style.display = 'none';
  }

  const processFile = async (e) => {
    e.preventDefault();
    if (e.target[0].value && e.target[1].files[0]) {
      pageInProgress();
      setSubmitBtnDisabled(false);

      const formData  = new FormData();
      formData.append('type', e.target[0].value);
      formData.append('file', e.target[1].files[0]);
      formData.append('uuid', uuid);
      formData.append('Accept', STEM_TYPE);

      // Upload file.
      axios.post(`${API_PATH}/process/`, formData, {
        headers: {
          'content-type': 'multipart/form-data',
          'X-CSRFToken': csrftoken
        }
      })
      .then((response) => {
        fileData = response.data;
        pageProcessComplete(response);
      })
      .catch((error) => {
        console.log(error.toJSON());
        handlePageError(error.message);
      })
    } else {
      showFileSelectError();
    }
  }

  const pageResetConfirmed = () => {
    purgeFiles(() => {
      window.onbeforeunload = () => {};
      window.location.reload();
    })
  }

  const pageReset = (force = false) => {
    if (window.confirm(leaveConfirmTxt)) {
      force && setStatusTxt(<div className="processing-txt">Cancelling.<Dots /></div>);
      pageResetConfirmed();
    } else {
      return;
    }
  }

  // Purge all output files.
  const purgeFiles = (callback) => {
    const formData = new FormData();
    formData.append('dirname', fileData.dirname);
    formData.append('uuid', uuid);

    axios.post(`${API_PATH}/purge/`, formData, {
      headers: {
        'content-type': 'multipart/form-data',
        'X-CSRFToken': csrftoken
      }
    })
    .then((response) => {
      if (callback) {
        callback();
      }
    })
    .catch(function (error) {
      console.log(error.toJSON());
      window.onbeforeunload = () => {};
      window.location.reload();
    });
  }

  return (
    <div className="songhill">
      <div className="songhill-main">
        <div className="actions-wrapper">
          <div className="actions">
            <h2 className="title">songhill<div className="cursor_box">_</div></h2>
            <div className="subtitle">free audio separation</div>
            <p className="logo-bubble"><img alt="songhill" id="icon-process" className="songhill-logo" src={logo} /></p>
            <form onSubmit={(e) => processFile(e)} id="form-process">
              <label>
                <h4>Separation Type</h4>
                <select name="stems" defaultValue="4">
                  <option value="2">2 Stems: Vocals and Accompaniment</option>
                  <option value="4">4 Stems: Vocals, Drums, Bass, Other</option>
                  <option value="5">5 Stems: Vocals, Drums, Bass, Piano, Other</option>
                </select>
              </label>
              <label>
                <h4>Select Audio File</h4>
                <div className="field_container">
                  <input name="file" type="file" onChange={(e) => handleFileAdd(e)} />
                </div>
              </label>
              <div id="submit_container">
                <input type="submit" id="process_button" disabled={submitBtnDisabled} className="btn-disabled" value="Process Audio" title="Process Audio" />
              </div>
            </form>
            <div id="error-txt" className="error-txt">{errorTxt}</div>
            <div id="status-txt">{statusTxt}</div>
            <div id="completed">
              <AudioPlayer />
              {completedMarkup}
            </div>
          </div>
        </div>
        <div className="info-box-wrapper">
          <div className="info-box">
            <h3>Welcome to <strong className="blue">Songhill</strong>.</h3>
            <p>Use Songhill to separate and isolate song tracks into their individual instrumental or vocal parts.</p>
            {/* <p>Musicians, singers, and students may use these isolated tracks to help them learn and practice specific parts of a song.</p> */}
            <p>Three separation types are available:</p>
            <div className="stem-info-boxes">
              <p><strong>2:</strong> <span className="stem-info-box">vocals</span><span className="stem-info-box">accompaniment</span></p>
              <p><strong>4:</strong> <span className="stem-info-box">vocals</span><span className="stem-info-box">drums</span><span className="stem-info-box">bass</span><span className="stem-info-box">other</span></p>
              <p><strong>5:</strong> <span className="stem-info-box">vocals</span><span className="stem-info-box">drums</span><span className="stem-info-box">bass</span><span className="stem-info-box">piano</span><span className="stem-info-box">other</span></p>
            </div>
            <p>Upload your audio file to generate isolated audio files for preview or download.</p>
            <p>We use the <a rel="noreferrer" target="_blank" href="https://github.com/deezer/spleeter">Spleeter</a> separation library which attempts to produce the best possible isolation of instrumental and vocal parts. Results will vary as it is based in machine learning.</p>
            <p>Songhill is a free service and is intended to promote and support the growth of musical learning, practice, and performance.</p>
            { /* <p>Inquiries and questions may be issued <a href={mailto}>here</a>.</p> */ }
            { SHOW_ADS && <div id="ad">
            <a href="https://www.buymeacoffee.com/songhill" target="_blank" rel="noreferrer"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-white.png" alt="Buy Me A Coffee" className="buy-me-a-coffee" /></a>
            </div>}
            <footer>
              <div className="copyright">&copy; 2024 <a href="mailto:songhill.com@gmail.com?subject=songhill.com">Ernest Millan</a></div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Songhill
