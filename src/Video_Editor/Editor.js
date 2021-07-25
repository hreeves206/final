import React from 'react';
import './css/editor.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVolumeMute, faVolumeUp, faPause, faPlay, faGripLinesVertical, faSync, faStepBackward, faStepForward } from '@fortawesome/free-solid-svg-icons'

class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isMuted: false,
            timings: [],
            playing: false,
            currently_grabbed: {"index": 0, "type": "none"},
            difference: 0.2,
            deletingGrabber: false,
            current_warning: null,
            counter: 0,
        }
        this.playVideo = React.createRef();
        this.progressBar = React.createRef();
        this.playBackBar = React.createRef();
    }

    warnings = {
        "delete_grabber": (<div>Please click on the grabber (either start or end) to delete it</div>)
    }

    componentDidMount = () => {
        // Check if video ended
        var self = this
        this.playVideo.current.addEventListener('timeupdate', function () {
            var seek = (self.playVideo.current.currentTime - self.state.timings[self.state.currently_grabbed.index].start) / self.playVideo.current.duration * 100;
            console.log(seek)
            self.progressBar.current.style.width = `${seek}%`;
            if ((self.playVideo.current.currentTime >= self.state.timings[self.state.timings.length-1].end)){
                self.playVideo.current.pause()
                self.setState({playing: false, counter: 0, currently_grabbed: {"index": 0, "type": "start"}}, () => {
                    self.playVideo.current.currentTime = self.state.timings[0].start;
                    self.progressBar.current.style.left = self.state.timings[0].start / self.playVideo.current.duration * 100;
                    self.progressBar.current.style.width = "0%";
                })
            }
            else if(self.playVideo.current.currentTime >= self.state.timings[self.state.counter].end){
                if((self.state.counter+1) < self.state.timings.length){
                    self.playVideo.current.currentTime = self.state.timings[self.state.counter+1].start
                    self.setState({counter: self.state.counter+1})
                }
            }
        });

        window.addEventListener("keyup", function (event) {
            if (event.key === " ") {
                self.play_pause();
            }
        });
        var time = this.state.timings
        this.playVideo.current.onloadedmetadata = () => {
            time.push({'start': 0, 'end': this.playVideo.current.duration})
            this.setState({timings: time});
        }
    }

    play_pause = () => {
        if(this.state.playing){
            this.playVideo.current.pause()
        }
        else{
            this.playVideo.current.play()
        }
        this.setState({playing: !this.state.playing})
    }

    updateProgress = (event) => {
        var playbackRect = this.playBackBar.current.getBoundingClientRect();
        var seekRatio = (event.clientX - playbackRect.left) / playbackRect.width
        var idx = 0
        var temp_time = this.playVideo.current.duration * seekRatio
        for(let x of this.state.timings){
            if(x.start <= temp_time && x.end >= temp_time){
                this.setState({currently_grabbed: {"index": idx, "type": "start"}, counter: idx}, () => {
                    this.playVideo.current.currentTime = temp_time
                })
            }
            idx += 1;
        }
    }

    startGrabberMove = (event) => {
        this.playVideo.current.pause()
        var playbackRect = this.playBackBar.current.getBoundingClientRect();
        var seekRatio = (event.clientX - playbackRect.left) / playbackRect.width
        const index = this.state.currently_grabbed.index
        const type = this.state.currently_grabbed.type
        window.addEventListener("mouseup", () => {window.removeEventListener('mousemove', this.startGrabberMove)})
        var time = this.state.timings
        var seek = this.playVideo.current.duration * seekRatio
        if((type == "start") && (seek > ((index != 0) ? (time[index-1].end+this.state.difference+0.2) : 0)) && seek < time[index].end-this.state.difference){
            this.progressBar.current.style.left = `${seekRatio*100}%`
            this.playVideo.current.currentTime = seek
            time[index]["start"] = seek
            this.setState({timings: time, playing: false})
        }
        else if((type == "end") && (seek > time[index].start+this.state.difference) && (seek < (index != (this.state.timings.length-1) ? time[index+1].start-this.state.difference-0.2 : this.playVideo.current.duration))){
            this.progressBar.current.style.left = `${time[index].start / this.playVideo.current.duration * 100}%`
            this.playVideo.current.currentTime = time[index].start
            time[index]["end"] = seek
            this.setState({timings: time, playing: false})
        }
        this.progressBar.current.style.width = "0%"
    }

    renderGrabbers = () => {
        return this.state.timings.map((x, index) => (
            <div key={"grabber_"+index}>
                <div className="grabber start" style={{left: `${x.start / this.playVideo.current.duration * 100}%`}} onMouseDown={(event) => {
                    if(this.state.deletingGrabber){
                        this.deleteGrabber(index)
                    }
                    else{
                        window.addEventListener('mousemove', this.startGrabberMove); this.setState({currently_grabbed: {"index": index, "type": "start"}, counter: index})
                    }
                }}>
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0" y="0" width="10" height="14" viewBox="0 0 10 14" xmlSpace="preserve">
                        <path className="st0" d="M1 14L1 14c-0.6 0-1-0.4-1-1V1c0-0.6 0.4-1 1-1h0c0.6 0 1 0.4 1 1v12C2 13.6 1.6 14 1 14zM5 14L5 14c-0.6 0-1-0.4-1-1V1c0-0.6 0.4-1 1-1h0c0.6 0 1 0.4 1 1v12C6 13.6 5.6 14 5 14zM9 14L9 14c-0.6 0-1-0.4-1-1V1c0-0.6 0.4-1 1-1h0c0.6 0 1 0.4 1 1v12C10 13.6 9.6 14 9 14z"/>
                    </svg>
                </div>
                <div className="grabber end" style={{left: `${x.end / this.playVideo.current.duration * 100}%`}} onMouseDown={(event) => {
                    if(this.state.deletingGrabber){
                        this.deleteGrabber(index)
                    }
                    else{
                        window.addEventListener('mousemove', this.startGrabberMove); this.setState({currently_grabbed: {"index": index, "type": "end"}, counter: index})
                    }
                }}>
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0" y="0" width="10" height="14" viewBox="0 0 10 14" xmlSpace="preserve">
                        <path className="st0" d="M1 14L1 14c-0.6 0-1-0.4-1-1V1c0-0.6 0.4-1 1-1h0c0.6 0 1 0.4 1 1v12C2 13.6 1.6 14 1 14zM5 14L5 14c-0.6 0-1-0.4-1-1V1c0-0.6 0.4-1 1-1h0c0.6 0 1 0.4 1 1v12C6 13.6 5.6 14 5 14zM9 14L9 14c-0.6 0-1-0.4-1-1V1c0-0.6 0.4-1 1-1h0c0.6 0 1 0.4 1 1v12C10 13.6 9.6 14 9 14z"
                        />
                    </svg>
                </div>
            </div>
        ))
    }

    addGrabber = () => {
        var time = this.state.timings
        var end = time[time.length-1].end+this.state.difference
        this.setState({deletingGrabber: false, current_warning: null})
        if(end >= this.playVideo.current.duration){
            return
        }
        time.push({"start": end+0.2, "end": this.playVideo.current.duration})
        this.setState({timings: time})
    }

    preDeleteGrabber = () => {
        if(this.state.deletingGrabber){
            this.setState({deletingGrabber: false, current_warning: null})
        }
        else{
            this.setState({deletingGrabber: true, current_warning: "delete_grabber"});
        }
    }

    deleteGrabber = (index) => {
        var time = this.state.timings
        if(time.length == 1){
            return
        }
        time.splice(index, 1);
        this.progressBar.current.style.left = `${time[0].start / this.playVideo.current.duration * 100}%`
        this.playVideo.current.currentTime = time[0].start
        this.progressBar.current.style.width = "0%"
        this.setState({timings: time, deletingGrabber: false, current_warning: null, currently_grabbed: {"index": 0, "type": "start"}})
    }

    skipStart = () => {
        if(this.state.playing){
            this.playVideo.current.pause()
        }
        this.playVideo.current.currentTime = this.state.timings[0].start;
        this.progressBar.current.style.left = this.state.timings[0].start / this.playVideo.current.duration * 100;
        this.progressBar.current.style.width = "0%";
        this.setState({currently_grabbed: {"index": 0, "type": "start"}, counter: 0})
    }

    skipEnd = () => {
        if(this.state.playing){
            this.playVideo.current.pause()
        }
        const curr_time = this.state.timings[this.state.timings.length-1].end
        this.playVideo.current.currentTime = curr_time;
        this.progressBar.current.style.left = this.state.timings[0].start / this.playVideo.current.duration * 100;
        this.progressBar.current.style.width = curr_time / this.playVideo.current.duration * 100;
        this.setState({currently_grabbed: {"index": (this.state.timings.length-1), "type": "end"}, counter: this.state.timings.length-1})
    }

    render = () => {
        return(
            <div className="wrapper">
                <video className="video" autoload="metadata" muted={this.state.isMuted} ref={this.playVideo} onClick={this.play_pause.bind(this)} >
                    <source src={this.props.videoUrl} type="video/mp4" />
                </video>
                <div className="playback">
                    {this.renderGrabbers()}
                    <div className="seekable" ref={this.playBackBar} onClick={this.updateProgress}></div>
                    <div className="progress" ref={this.progressBar}></div>
                </div>

                <div className="controls">
                    <div className="player-controls">
                        <button className="settings-control" title="Reset Video"><FontAwesomeIcon icon={faSync} /></button>
                        <button className={"settings-control"} title="Mute/Unmute Video" onClick={() => this.setState({isMuted: !this.state.isMuted})}>{this.state.isMuted ? <FontAwesomeIcon icon={faVolumeMute} /> : <FontAwesomeIcon icon={faVolumeUp} />}</button>
                    </div>
                    <div className="player-controls">
                        <button className="seek-start" title="Skip to Start" onClick={this.skipStart}><FontAwesomeIcon icon={faStepBackward} /></button>
                        <button className="play-control" title="Play/Pause" onClick={this.play_pause.bind(this)} >{this.state.playing ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} /> }</button>
                        <button className="seek-end" title="Skip to End" onClick={this.skipEnd}><FontAwesomeIcon icon={faStepForward} /></button>
                    </div>
                    <div>
                        <button className="trim-control margined" onClick={this.addGrabber}>Add <FontAwesomeIcon icon={faGripLinesVertical} /></button>
                        <button className="trim-control margined" onClick={this.preDeleteGrabber}>Delete <FontAwesomeIcon icon={faGripLinesVertical} /></button>
                        <button className="trim-control" onClick={() => alert('This would redirect to a completion page.')}>Trim</button>
                    </div>
                </div>
                {this.state.current_warning != null ? <div className={"warning"}>{this.warnings[this.state.current_warning]}</div> : ""}
            </div>
        )
    }
}

export default Editor