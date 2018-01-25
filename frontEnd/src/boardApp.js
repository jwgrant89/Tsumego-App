import React, { Component } from 'react';
// import update from 'immutability-helper'
// import logo from './logo.svg';
import './boardApp.css'
// import Tree from './tree.js';

const s = 570/20;
const w=570;
// the game, which holds the state of the game so far, including the history
// export default class Boardapp extends Component {
//   //default state at start of the game
//   constructor(props){
//     super(props);
//     const gameTree = this.props.gameTree;
//     const node = this.props.node;
//     this.state ={
//       gameTree: gameTree,
//       currentMove: node,
//     }
//   }
//   componentWillReceiveProps(nextProps){
//     // state is seeded from props, so we need to update the state
//     // if the props change
//     if (nextProps != this.props){
//       const node = this.props.node;
//       this.state ={
//         gameTree: new Tree(node),
//         currentMove: node,
//       }
//     }
//   }
//   //what is displayed
//   render(){
//     // const history = this.state.history;
//     const gameTree = this.state.gameTree;
//     const currentMove = this.state.currentMove;
//     let blackToPlay = gameTree.has(currentMove).depth()%2===0;
//     let boardstate = this.getBoardstate(gameTree,currentMove).boardstate;
//     let prisoners = this.getBoardstate(gameTree,currentMove).prisoners;
//     return (
//         <Goban ref = "Goban" boardstate = {boardstate} mousePos = {this.state.mousePos} blackToPlay = {blackToPlay} boardClick = {this.boardClick} mousePosition={this.mousePosition} currentMove={currentMove}/>
//     );
//   }


// }

export default class Goban extends Component{
  constructor(props){
    super(props);
    this.state= {mousePos : {x:0, y:0},clickAction:"move"};
    this.overlayClick = this.overlayClick.bind(this);
    this.mousePosition = this.mousePosition.bind(this);
    this.modeChange=this.modeChange.bind(this);
    this.updateLabel=this.updateLabel.bind(this);
  }
  componentWillReceiveProps(nextProps){
    // if we're not in edit mode, click action should always be move
    if(!nextProps.mode.editMode){
      this.setState({clickAction:"move"})
    }
  }

  componentDidMount(){
    const boardcontext = this.refs.board.getContext('2d');
    // vertical lines
    for (let i=1; i<20;i++){
      boardcontext.beginPath();
      boardcontext.moveTo(i*s,s);
      boardcontext.lineTo(i*s, s*19);
      boardcontext.stroke();
    };
    //horizontal lines
    for (let i=1;i<20;i++){
      boardcontext.beginPath();
      boardcontext.moveTo(s,i*s);
      boardcontext.lineTo(s*19,i*s);
      boardcontext.stroke();
    };
    // star points
    var radius = s/5;
    for (let i=0;i<3;i++){
      for (let j=0;j<3;j++){
        boardcontext.beginPath();
        boardcontext.arc(4*s+6*i*s,4*s+6*j*s , radius, 0, 2 * Math.PI, false);
        boardcontext.fillstyle="black";
        boardcontext.fill();
      };
    };
    // top coordinates
    boardcontext.save();
    boardcontext.fillStyle = "black";
    boardcontext.font="12px Helvetica";
    boardcontext.textBaseline = "middle";
    boardcontext.textAlign = "center";
    for(let i=1;i<20;i++){
      let j;
      // skip the character "I"
      if(i<9){
        j=i+64;
      } else{
        j=i+65
      }
      boardcontext.fillText(String.fromCharCode(j),i*s,s/2);
      boardcontext.fillText(i,s/2,i*s);
    }
  }

  mousePosition(e){
    const boardrectangle = this.refs.board.getBoundingClientRect();
    const x = e.clientX-boardrectangle.left;
    const y = e.clientY-boardrectangle.top;
    var nodex = Math.round(x/s)-1;
    var nodey = Math.round(y/s)-1;
    if (nodex <0 || nodex>18 || nodey <0 || nodey >18){
      return;
    }
    this.setState({
      mousePos : {x: nodex, y: nodey}
    })
  }

  overlayClick(e){
    const {x,y} = this.state.mousePos;
    if(this.state.clickAction ==="move"){
      let response = this.props.boardClick(x,y);
      // the function plays the move at the place where the player clicked,
      // and response contains the follow-up white move if autoplay is enabled,
      // or else is undefined;
      if(response){
        setTimeout(() => {this.props.boardClick(response.x,response.y)},this.props.autoplayspeed);
      }
      return;
    }
    if(this.state.clickAction.label){
      this.props.addLabel(this.state.clickAction.label,x,y);
      return;
    }
    this.props.addDecoration(this.state.clickAction,x,y);
  }

  modeChange(action){
    if((this.state.clickAction===action) || (this.state.clickAction.label && action.label)){
      this.setState({clickAction:"move"})
      return;
    }
    this.setState({clickAction:action});
  }

  updateLabel(label){
    this.setState({clickAction:{label:label}});
  }

  render(){
    return(
      <div id = "Goban">
        <div id= "board"><canvas id = "board" ref= "board" width = "570px" height = "570px" />
        <Stones
          boardstate={this.props.boardstate}
          currentMove={this.props.currentMove}/>
        <Cursor
          blackToPlay = {this.props.blackToPlay}
          mousePos = {this.state.mousePos} />
        <Overlay
          overlayClick={this.overlayClick}
          mousePosition={this.mousePosition}
          mode={this.props.mode}
          nextProblem={this.props.nextProblem}
          currentMove={this.props.currentMove}
          reset = {this.props.reset}/> </div>
        {this.props.mode.editMode && <GobanButtons
          clickAction={this.state.clickAction}
          modeChange={this.modeChange}
          updateLabel={this.updateLabel}/>}
      </div>)
    }
}

class Overlay extends Component {
  constructor(props){
    super(props);
    let finished = this.props.mode.autoplay && !!this.props.currentMove.endstatus;
    this.state={finished:finished};
    this.timeout=null;
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.moveOn=this.moveOn.bind(this);
    this.debounce=this.debounce.bind(this);
  }
  shouldComponentUpdate(nextProps,nextState){
    // ensure that the componentDidUpdate code only triggers
    // once per problem
    // return this.props.currentMove !== nextProps.currentMove || this.state!==nextState;
    return this.state.finished !== nextState.finished;
  }
  componentWillReceiveProps(nextProps){
    let finished = nextProps.mode.autoplay && !nextProps.mode.showsolution && !!nextProps.currentMove.endstatus;
    this.setState({finished:finished});
  }
  componentDidUpdate(){
    let canvas = this.refs.overlay;
    let ctx = canvas.getContext("2d");
    if(this.state.finished){
      const currentMove=this.props.currentMove;
      const endstatus= currentMove.endstatus;
      let status = endstatus ==="S"? "Solved!" : "Failed!";
      let colour = endstatus === "S"? "green":"red";
      let x = canvas.width /2;
      let y = canvas.height /2;
      ctx.save();
      ctx.fillStyle = colour;
      ctx.fillRect(0,y-16,canvas.width,32);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "white";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "16px Helvetica";
      ctx.fillText(status,x,y);
      ctx.restore();
      // move to next problem after 2000 seconds, unless cancelled by a
      // click event
      if(endstatus==="S"){
        this.timeout= setTimeout(
          () =>{this.moveOn(endstatus)()},2000);
        return;
      }
    } else {
      ctx.save();
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.restore();
    };
  }
  componentDidMount(){
    this.refs.overlay.addEventListener("mousemove",this.props.mousePosition);
  }

  render(){
    return(
      <canvas id = "overlay" ref = "overlay" width = "570px" height= "570px"  onClick = {this.handleOverlayClick} />
    )
  }
  handleOverlayClick(evt){
    if(this.state.finished){
      //delete the timer to move to the next problem since we're doing it straight away
      if(this.props.currentMove.endstatus==="S"){
        clearTimeout(this.timeout);
        this.moveOn(this.props.currentMove.endstatus,true)();
      } else {
        this.props.reset();
      }
    } else {
      this.props.overlayClick(evt);
    }
  }
  moveOn(status){
    let self=this;
    let action = function(){
      if(status ==="S"){
        self.props.nextProblem();
      }
      // else {
      //   self.props.reset();
      // };
      self.setState({finished:false});
      return;
    }
    // debounce in order to ignore repeated clicks
    return this.debounce(()=>{action()},1000,true);
  }
  debounce(func, wait, immediate) {
  // triggers immediately if immediate, and then only again after !wait mseconds
    var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			if (!immediate) func.apply(context, args);
  		};
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) func.apply(context, args);
  	};
  };
}
class Stones extends React.Component {
  constructor(props){
    super(props);
    this.draw = this.draw.bind(this);
    this.drawboard = this.drawboard.bind(this);
  }
  componentDidMount(){
      this.drawboard();
  }
  // only update the stone layer if a move has actually been made
  shouldComponentUpdate(nextProps,nextState){
    return this.props.boardstate !== nextProps.boardstate;
  }
  componentDidUpdate(prevProps,prevState){
    this.drawboard();
  }
  render(){
    return(
      <canvas id = "stones" ref= "stones" width = "570px" height = "570px"/>
    );
  }
  drawboard(){
    const boardstate = this.props.boardstate;
    const currentMove = this.props.currentMove;
    const canvas = this.refs.stones;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let i=0; i<19; i++){
      for (let j=0; j<19; j++){
          let colour = boardstate[i][j];
          this.draw(i,j,colour);
      };
    };
    // if (currentMove.type === "root" || currentMove.type === "pass"){
    //   return;
    // };

    // mark the current move;
    ctx.save();
    ctx.beginPath();
    let x = (currentMove.x+1)*s;
    let y = (currentMove.y+1)*s;
    ctx.moveTo(x,y);
    ctx.lineTo(x+s/2,y);
    ctx.lineTo(x,y+s/2);
    ctx.fillStyle = currentMove.colour === "black" ? "white" : "black";
    ctx.fill();
    ctx.restore();
    // draw the decorations;
    for (let i in currentMove.decorations){
      for(let j of currentMove.decorations[i]){
        let coord = {x:(j.x+1)*s,y:(j.y+1)*s};
        if(i==="triangle"){
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(coord.x,coord.y-s/4);
          ctx.lineTo(coord.x-(Math.sqrt(3)/2)*(s/4), coord.y + s/8);
          ctx.lineTo(coord.x+(Math.sqrt(3)/2)*(s/4), coord.y + s/8);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
        if(i==="square"){
          ctx.save();
          ctx.beginPath();
          ctx.strokeRect(coord.x-s/4,coord.y-s/4,s/2,s/2);
          ctx.restore();
        }
        if(i==="cross"){
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(coord.x-s/4,coord.y-s/4);
          ctx.lineTo(coord.x+s/4,coord.y+s/4);
          ctx.stroke();
          ctx.moveTo(coord.x+s/4,coord.y-s/4);
          ctx.lineTo(coord.x-s/4,coord.y+s/4);
          ctx.stroke();
          ctx.restore();
        }
        if(i==="circle"){
          ctx.save();
          ctx.beginPath();
          ctx.arc(coord.x,coord.y,s/4,0,2*Math.PI);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    for (let i =0;i< currentMove.labels.length;i++){
      let coord = currentMove.labels[i][0];
      let label = currentMove.labels[i][1];
      ctx.save();
      ctx.beginPath();
      ctx.clearRect(coord.x-s/4,coord.y-s/4,s/2,s/2);
      ctx.strokeStyle="black";
      ctx.lineWidth= 2;
      ctx.fillStyle = "white";
      ctx.font = "16px Verdana";
      ctx.textBaseline="middle";
      ctx.textAlign="center";
      ctx.strokeText(label,(coord.x+1)*s,(coord.y+1)*s);
      ctx.fillText(label,(coord.x+1)*s,(coord.y+1)*s);
      ctx.restore();
    }
  }
  draw(i,j,colour){
    let x = (i+1)*s;
    let y = (j+1)*s;
    const ctx = this.refs.stones.getContext('2d');
    ctx.save();
    ctx.beginPath();
    if (colour === "N" || colour ==="K"){
      //clear the space, with a clear rectangle over the stone
      ctx.clearRect(x-s/2,y-s/2,s,s);
      ctx.fill();
    } else {
      ctx.arc(x,y,(s)/2,0,2*Math.PI,false);
      if (colour==="B"){
        let grad = ctx.createRadialGradient(x-s/4,y-s/4,(s-1)/32,x,y,s/2);
        grad.addColorStop(0,'#696969');
        grad.addColorStop(1,"black");
        ctx.fillStyle = grad;}
      else{
        let grad = ctx.createRadialGradient(x-s/4,y-s/4,(s-1)/32,x,y,s/2);
        grad.addColorStop(0,'white');
        grad.addColorStop(1,"#A9A9A9");
        ctx.fillStyle = grad;}
      ctx.fill();
    };
    ctx.restore();
  };
}

class Cursor extends React.Component{
  componentDidUpdate(){
    const blackToPlay = this.props.blackToPlay;
    const ctx = this.refs.cursor.getContext('2d');
    const {x,y} = this.props.mousePos;
    let a = (x+1)*s;
    let b = (y+1)*s;
    ctx.clearRect(0,0,w,w);
    let colour = blackToPlay ? "black" : "white";
    ctx.beginPath();
    ctx.fillStyle = colour;
    ctx.strokeStyle = "black";
    ctx.rect(a-s/4,b-s/4,s/2,s/2);
    ctx.fill();
    ctx.stroke();
  }

  render(){
    return(
      <canvas id="cursor" ref="cursor" width = "570px" height = "570px" />
    )
  }

}

const movedecorations=
  {
    blackmoves: "\u26AB",
    whitemoves:"\u26AA",
    triangle:"\u25B3",
    cross: "\u2715",
    square: "\u25FB",
    circle: "\u25EF",
  }


class GobanButtons extends Component{
  render(){
    let buttons = [];
    for(let i in movedecorations){
      let newbutton = <GobanButton modeChange={this.props.modeChange} key={i} symbol={i} select={this.props.clickAction===i}/>
      buttons.push(newbutton);
    }
    return(
      <div className="gobanbuttons">
        {buttons}
        <LabelButton modeChange={this.props.modeChange} updateLabel={this.props.updateLabel} select = {this.props.clickAction.label}/>
      </div>
    )
  };
}
// <button className= "gobanbutton" onClick={()=> this.props.modeChange("whitemoves")}>&#x26AA;</button>
// <button className= "gobanbutton" onClick={()=> this.props.modeChange("blackmoves")}>&#x26AB;</button>
// <button className="gobanbutton"  onClick={()=> this.props.modeChange("triangle")}>&#x25B3;</button>
// <button className="gobanbutton"  onClick={()=> this.props.modeChange("square")}>&#x25FB;</button>
// <button className="gobanbutton"  onClick={()=> this.props.modeChange("circle")}>&#x25EF;</button>
// <button className="gobanbutton"  onClick={()=> this.props.modeChange("cross")}>&#x2715;</button>
// <button className="gobanbutton"  onClick={()=> this.props.modeChange("label")}>A-Z</button>

class GobanButton extends Component{
  render(){
    let cssclass = "gobanbutton";
    if(this.props.select){
      cssclass+="active";
    }
    return(
      <button className={cssclass} onClick={()=>this.props.modeChange(this.props.symbol)}>{movedecorations[this.props.symbol]}</button>
    )
  }
}

class LabelButton extends Component{
  constructor(){
    super();
    this.state={text:"A"};
    this.handleChange=this.handleChange.bind(this);
  }
  render(){
    let cssclass="gobanbutton";
    if(this.props.select){
      cssclass+="active";
    }
    return(
      <div className={cssclass} id="labelbutton" onClick={()=>this.props.modeChange({label:this.state.text})}>
        <input id="label" type = "text" size="1" maxLength="1" value={this.state.text} onChange={this.handleChange}/>
      </div>
    )
  }
  handleChange(e){
    this.setState({text:e.target.value});
    this.props.updateLabel(e.target.value);
  }
}
// export default boardApp;
