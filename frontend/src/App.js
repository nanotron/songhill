// Dependencies:
// npm i

import { useEffect, useState } from 'react'
import axios from 'axios'
import logo from './songhill-logo.png'
import play_icon from './play.png'
import './App.css'

function App() {
  let fileData = {}

  // 15 minutes.
  const SESSION_TIME = 900000
  // 200 megabytes.
  const MAX_FILESIZE = 200000000
  const MAX_FILESIZE_MB = MAX_FILESIZE/1000000
  const STEM_EXT = '.mp3'
  const STEM_TYPE = 'audio/mpeg'
  const mailto = 'mailto:songhill.com@gmail.com'
  const leaveConfirmTxt = 'This session will be lost if you leave. Do you want to start over?'

  const [ internalError, setInternalError ] = useState(false)
  const [ uuid, setUuid ] = useState()
  const [ csrftoken, setCsrftoken ] = useState()
  const [ errorTxt, setErrorTxt ] = useState()
  const [ completedMarkup, setCompletedMarkup ] = useState('')

  let PRODMODE = true
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    PRODMODE = false
  }

  const API_PATH = PRODMODE ? '/api' : '';

  const byId = (id) => {
    return document.getElementById(id)
  }

  const Dots = () => {
    return (<span className="dots">
      <span>.</span><span>.</span><span>.</span>
    </span>)
  }
  const initialStatusTxt = <div>Processing.<Dots /></div>
  const [ statusTxt, setStatusTxt ] = useState(initialStatusTxt)

  const ErrorCommon = () => {
    return <div>
      <div>An error has occurred.</div>
      <div>Please <a href="/">reload</a> and try again.</div>
    </div>
  }

  const showError = () => {
    byId('process_form').style.display = 'none'
    setErrorTxt(ErrorCommon)
  }

  // Only run provisionUser once during load of page.
  // Remove the empty array to apply with every page update.
  useEffect(() => {
    fetch(`${API_PATH}/provision`)
    .then((response) => response.json())
    .then(data => {
      // eslint-disable-next-line
      setCsrftoken(data.csrftoken)
      setUuid(data.uuid)
    })
    .catch(() => {
      setInternalError(true)
      return
    })

    if (internalError) {
      byId('process_form').style.display = 'none'
      setErrorTxt(ErrorCommon)
    }
  }, [internalError, API_PATH])

  const downloadFile = (path, filename) => {
    fetch(`${API_PATH}/${path}?filename=${filename}`)
    .then((response) => response.blob())
    .then((data) => {
      var anchor = document.createElement("a")
      anchor.href = window.URL.createObjectURL(data)
      anchor.download = filename
      anchor.click()
    })
    .catch(function() {
      showError()
    })
  }

  const handleFileAdd = (e) => {
    const audio_file = e.target.files[0]
    // Supported content types.
    const valid_types = ['audio/', '/ogg']
    const is_audio_file = valid_types.some(type => audio_file.type.includes(type))
    // Check file size.
    const is_size_valid = audio_file.size <= MAX_FILESIZE
    if (!is_audio_file || !is_size_valid) {
      byId('error_txt').style.display = 'block'
      byId('submit_container').style.display = 'none'
    }
    if (!is_audio_file) {
      setErrorTxt(<div>Please select an audio file. <div className='small-txt'>e.g., mp3, wav, ogg, flac, etc.</div></div>)
    }
    if (!is_size_valid) {
      setErrorTxt(`Maximum file size is ${MAX_FILESIZE_MB} megabytes.`)
    }
    if (e.target.value && is_audio_file) {
      byId('error_txt').style.display = 'none'
      byId('submit_container').style.display = 'block'
    }
  }

  const stemPlay = (e, filename) => {
    fetch(`${API_PATH}/stem?filename=${filename}`)
    .then((response) => response.blob())
    .then((data) => {
      const filename_only = filename.split('/')[1].replace(STEM_EXT,'')
      const now_playing = `Now playing: ${filename_only}`
      byId('audio_player').style.display = 'block'
      byId('audio_player').src = window.URL.createObjectURL(data)
      byId('audio_player').title = now_playing
      byId('audio_player').load()
      byId('audio_player').play()      
      byId('status_txt').innerText = now_playing
    })
    .catch(function() {
      showError()
    })
  }

  const AudioPlayer = () => {
    return <audio id="audio_player" src="" type={STEM_TYPE} controls />
  }

  const StemRows = ({data}) => {
    const stem_dir = data.dirname
    const stem_rows = data.stems.map((stem) => {
      const stem_name = stem.replace(STEM_EXT, '')
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
    let time_left = SESSION_TIME
    let timer = setInterval(() => {
      if (time_left <= 0) {
        window.onbeforeunload = () => {}
        clearInterval(timer)
        purgeFiles()
        byId('error_txt').style.display = 'block'
        byId('status_txt').style.display = 'none'
        byId('completed').style.display = 'none'
        setErrorTxt(<div>Your session has expired. Please reload or <button className="btn-link" onClick={() => pageResetConfirmed()}>start over</button>.</div>)
      } else {
        time_left = time_left - 1000
      }
    }, 1000)
  }

  const handlePageError = (error) => {
    window.onbeforeunload = () => {}
    byId('process_icon').className = 'App-logo'
    if (error) {
      byId('error_txt').style.display = 'block'
      const email_link = `${mailto}?subject=${error}`
      setErrorTxt(<div>
        <div>An error has occurred.</div>
        <div>Please reload, <button className="btn-link" onClick={() => pageResetConfirmed()}>try again</button>, or <a href={email_link}>contact us</a>.</div>
      </div>)
      setStatusTxt(<div className='smaller-txt'>${error}</div>)
    }
  }

  const pageProcessComplete = (response) => {
    byId('completed').style.display = 'block'  
    byId('process_icon').className = 'App-logo'    
    if (response.data.status === 'complete') {
      setStatusTxt(`Processing ${response.data.status}!`)
      sessionCountdown()
      setCompletedMarkup(<div>
        <StemRows data={response.data} />
        <button className="btn" onClick={() => downloadFile('zip', response.data.dirname)} title="Download all files as a zip file.">Download all files</button>
        <div className="small-txt"><button className="btn-link" onClick={() => pageReset()}>Process new audio</button></div>
      </div>)
    } else {
      handlePageError(response.data.error)
    }
  }

  const pageInProgress = () => {
    window.onbeforeunload = (e) => { return leaveConfirmTxt }
    byId('process_icon').className = 'App-logo-anim'
    byId('status_txt').style.display = 'block'
    byId('process_form').style.display = 'none'
  }

  const processFile = async (e) => {
    e.preventDefault()
    pageInProgress()

    // Upload file.
    const formData  = new FormData()
    formData.append('type', e.target[0].value)
    formData.append('file', e.target[1].files[0])
    formData.append('uuid', uuid)
    formData.append('Accept', STEM_TYPE)
    axios.post(`${API_PATH}/process/`, formData, {
      headers: {
        'content-type': 'multipart/form-data',
        'X-CSRFToken': csrftoken
      }
    })
    .then((response) => {
      fileData = response.data
      pageProcessComplete(response)
    })
    .catch((error) => {
      console.log(error.toJSON());
      handlePageError(error.message)
    });
  }

  const pageResetConfirmed = () => {
    purgeFiles(() => {
      window.onbeforeunload = () => {}
      window.location.reload()
    })
  }

  const pageReset = () => {
    if (window.confirm(leaveConfirmTxt)) {
      pageResetConfirmed()
    } else {
      return
    }
  }

  // Purge all output files.
  const purgeFiles = (callback) => {
    const formData = new FormData()
    formData.append('dirname', fileData.dirname)
    axios.post(`${API_PATH}/purge/`, formData, {
      headers: { 
        'content-type': 'multipart/form-data',
        'X-CSRFToken': csrftoken 
      }
    })
    .then((response) => {
      if (callback && response?.headers?.status === 'cleaned') {
        callback()
      }
    })
  }

  return (
    <div className="App">
      <main className="App-main">
        <h2 className="title">songhill</h2>
        <div className="subtitle">audio separation</div>
        <p className="logo_bubble"><img alt="songhill" id="process_icon" className="App-logo" src={logo} /></p>
        <form onSubmit={(e) => processFile(e)} id="process_form">
          <label>
            <h4>Choose a Stem Type</h4>
            <select name="stems" defaultValue="4">
              <option value="2">2 Stems: Vocals and Accompaniment</option>
              <option value="4">4 Stems: Vocals, Drums, Bass, Other</option>
              <option value="5">5 Stems: Vocals, Drums, Bass, Piano, Other</option>
            </select>
          </label>
          <label>
            <h4>Select an Audio File</h4>
            <div className="field_container">
              <input name="file" type="file" onChange={(e) => handleFileAdd(e)} />
            </div>
          </label>
          <div id="submit_container">
            <input type="submit" id="process_button" value="Process Audio" title="Process Audio" />
          </div>
        </form>
        <div id="error_txt" className="error_txt">{errorTxt}</div>
        <div id="status_txt">{statusTxt}</div>     
        <div id="completed">
          <AudioPlayer />
          {completedMarkup}
        </div>
        { PRODMODE && <div id='ad'>
          <div className='ad-test'>test</div>
        </div>}
      </main>
      <footer>
        &copy; 2022 songhill.com. <a href={mailto}>Contact us</a>.
        <div>Audio processing provided by <a rel="noreferrer" target="_blank" href="https://github.com/deezer/spleeter">Spleeter</a>.</div>
      </footer>
    </div>
  )
}

export default App
