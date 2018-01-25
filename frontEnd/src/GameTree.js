// import Tree from './tree.js'
import React, { Component } from 'react';

const s = 570/20;

export default class GameTree extends Component{
  constructor(){
    super();
    this.drawGameTree = this.drawGameTree.bind(this);
    this.gametreemousepos = this.gametreemousepos.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.state = {mousePos: {x:0,y:0},drag:null};
    this.mousedown=this.mousedown.bind(this);
    this.mouseup=this.mouseup.bind(this);
    this.mouseleave=this.mouseleave.bind(this);
  }
  componentWillReceiveProps(nextProps){
    if(nextProps.currentMove!==this.props.currentMove){
      this.refs.gametreecontainer.scrollLeft= XSpacing(nextProps.currentMove.drawatx-2);
      this.refs.gametreecontainer.scrollTop = YSpacing(nextProps.currentMove.drawaty-2);
    }
  }
  componentDidMount(){
    //draw the game tree as soon as the component mounts
    const canvas = this.refs.gametree;
    //component does not always render the canvas, so canvas may be undefined
    if (canvas===undefined){
      return;
    }
    const ctx = canvas.getContext("2d");
    ctx.fillStyle= "#E3F6FD";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    this.drawGameTree(this.props.gameTree,this.props.currentMove);
    //add the event listener for the mouse position
    canvas.addEventListener("mousemove",this.gametreemousepos);
  }

  gametreemousepos(e){
    const treerectangle = this.refs.gametree.getBoundingClientRect();
    const x = e.clientX-treerectangle.left;
    const y = e.clientY-treerectangle.top;
    let node = {x:0,y:0};
    // find the node on the grid nearest to where the mouse is
    while((XSpacing(node.x)+XSpacing(node.x+1))/2<x){
      node.x++;
    };
    while((YSpacing(node.y)+YSpacing(node.y+1))/2<y){
      node.y++;
    }
    this.setState({mousePos: node});
  }

  handleClick(){
    let {x,y} = this.state.mousePos;
    this.props.gameTreeClick(x,y);
  }

  componentDidUpdate(){
    this.drawGameTree(this.props.gameTree,this.props.currentMove);
  }

  drawGameTree(tree,move){
    const canvas = this.refs.gametree;
    if (canvas===undefined){
      return;
    }
    const ctx = canvas.getContext("2d");
    // first calculate the draw coordinates
    function assignCoordinates(tree){
      let coordlist = [];
      tree.contains(function(node){
        // x coordinate is its depth in the tree
        node.data.drawatx = node.depth();
        // reset any predefined y coordinate;
        node.data.drawaty = null;
      },tree.traverseDF);
      let y=0;
      tree.contains(function(node){
        //we need a y value that is compatible with all parents
        let variation = tree.parents(node.data);
        // if a parent already has a y coordinate, our variation should
        // appear below it, so we should begin to check for y at least as large
        // as the largest y already assigned
        variation.contains(function(eachnode){
          if(eachnode.data.drawaty > y){
            y = eachnode.data.drawaty;
          }
        },variation.traverseDF);
        function found(y) {
          let isfound = true;
          // check if every parent not yet assigned fits at this coordinate
          // we also leave space for the lines between the nodes
          variation.contains(function(eachnode){
            if(eachnode.data.drawaty === null){
              if(hascoord(new Set(coordlist),[eachnode.data.drawatx,y]) || hascoord(new Set(coordlist),[eachnode.data.drawatx+1,y]) ){
                isfound = false;
              }
            }
          },variation.traverseDF);
          return isfound;
        }
        while(!found(y)){
            y++;
        }
        // now set our y coordinate:
        variation.contains(function(eachnode){
          if(eachnode.data.drawaty === null){
            eachnode.data.drawaty = y;
            coordlist.push([eachnode.data.drawatx,eachnode.data.drawaty]);
          }
        },variation.traverseDF);
      },tree.traverseDF);
      return coordlist;
    }

    let coordlist = assignCoordinates(tree);
    // now resize the canvas to fit everything
    let width = 400;
    let height = 200;
    for (let i=0; i<coordlist.length;i++){
      let x = coordlist[i][0];
      let y = coordlist[i][1];
      if(XSpacing(x+1)>width){
        width = XSpacing(x+1);
      }
      if(YSpacing(y+1)>height){
        height = YSpacing(y+1);
      }
    }
    canvas.width = width;
    canvas.height = height;

    // redraw the background
    ctx.save();
    ctx.fillStyle= "#E3F6FD";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();

    let currentvar = tree.parents(move);
    if (move.type !== "root"){
      ctx.save();
      ctx.beginPath();
      ctx.arc(XSpacing(move.drawatx),YSpacing(move.drawaty),s/2,2*Math.PI,false);
      if(move.endstatus==="S"){
        ctx.strokeStyle = "Chartreuse";
      } else if (move.endstatus==="F") {
        ctx.strokeStyle = "red";
      }
      else {
        ctx.strokeStyle = "blue";
      }
      ctx.lineWidth =4;
      ctx.stroke();
      ctx.restore();
    }
    tree.contains(function(drawnode){
      let x = XSpacing(drawnode.data.drawatx);
      let y = YSpacing(drawnode.data.drawaty);
      let current = currentvar.has(drawnode.data) ===null? false:true;
      if(drawnode.data.type === "root"){
        ctx.save();
        ctx.beginPath();
        ctx.arc(x,y,s/4,2*Math.PI,false);
        ctx.fillStyle="black";
        ctx.fill();
        ctx.restore();
      } else {
        let colour = drawnode.data.drawatx%2===1 ? "black" : "white";
        ctx.save();
        if(!current){
          ctx.globalAlpha=0.5;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(x,y,s/2,2*Math.PI,false);
        ctx.fillStyle = colour;
        ctx.stroke();
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = colour==="black"? "white" : "black";
        ctx.font="12px Verdana";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(CoordStringfrom(drawnode.data.x,drawnode.data.y),x,y);
        ctx.restore();
        ctx.restore();
      }
      for (let i=0; i<drawnode.children.length;i++){
        let x2 = XSpacing(drawnode.children[i].data.drawatx);
        let y2 = YSpacing(drawnode.children[i].data.drawaty);
        let colour=getLineColour(tree,drawnode.children[i]);
        if( y===y2){
          let l = Math.sqrt((x-x2)**2 + (y-y2)**2);
          let t = s/(2*l);
          let second_circle_edge = {x: x*t+ x2*(1-t), y: y*t + y2*(1-t)}
          let first_circle_edge = {x: x2*t+ x*(1-t), y: y2*t + y*(1-t)};
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(first_circle_edge.x,first_circle_edge.y);
          ctx.lineTo(second_circle_edge.x,second_circle_edge.y);
          ctx.strokeStyle=colour;
          ctx.stroke();
          ctx.restore();
        }
        else{
          let first_circle_edge = {x:x,y: y+(s/2)};
          let second_circle_edge = {x: x2-s/2, y:y2};
          let control = {x: XSpacing(drawnode.children[i].data.drawatx -1),y:y2}
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(first_circle_edge.x,first_circle_edge.y);
          ctx.quadraticCurveTo(control.x,control.y,second_circle_edge.x,second_circle_edge.y);
          ctx.strokeStyle=colour;
          ctx.stroke();
          ctx.restore();
        }
      }
    },tree.traverseBF);
    function getLineColour(tree,node){
      let subtree = tree.subtree(node.data);
      let colour = "red";
      subtree.contains(function(checknode){
        if (checknode.data.endstatus==="S"){
          colour = "Chartreuse";
        }
      },subtree.traverseDF);
      return colour;
    }
  }
  render(){
    return(
      <div id="gametreebox">
        <div id="gametreecontainer" ref="gametreecontainer">
          <canvas id="gametree" ref="gametree" width = "400px" height = "180px"
            onMouseDown = {this.mousedown}
            onMouseUp={this.mouseup}
            onMouseLeave={this.mouseleave}/>
        </div>
      </div>)
  }

  mousedown(){
    let {x,y} = this.state.mousePos;
    // first change the current move
    this.handleClick(x,y);
    // now remember this as the point we started dragging
    this.setState({drag:{x:x,y:y}});
  }
  mouseup(){
    if(this.state.drag===null){
      return;
    }
    let currentMove=this.props.currentMove;
    if (currentMove.type ==="root"){
      this.setState({drag:null});
      return;
    }
    let currentNode = this.props.gameTree.has(currentMove);
    let siblings = currentNode.parent.children;
    let index = siblings.indexOf(currentNode);
    let y = this.state.drag.y;
    let newy = this.state.mousePos.y;
    // if we've landed on the same node, don't do anything
    if (newy -y===0){
      return;
    }
    let approxy = 0;
    let error=Infinity
    /*
    to avoid jumpy behaviour, we traverse the siblings array in different directions
    depending on whether we have dragged up or down
    to give the drag a tendency to not change anything
    */
    if(newy-y>0){
      for(let i=0;i<siblings.length;i++){
        if(Math.abs(siblings[siblings.length - 1 -i].data.drawaty-newy)<=error){
          approxy = siblings.length - 1 -i;
          error=Math.abs(siblings[siblings.length -1 -i].data.drawaty-newy);
        }
      }
    } else {
      for(let i=0;i<siblings.length;i++){
        if(Math.abs(siblings[i].data.drawaty-newy)<=error){
          approxy = i;
          error=Math.abs(siblings[i].data.drawaty-newy);
        }
      }
    }
    if(index===approxy){
      return;
    } else{
      let newtree = this.props.gameTree.move(currentMove,approxy);
      this.props.setGameTree(newtree);
    }
    this.setState({drag:null});
  }
  mouseleave(){
    //if mouse leaves the canvas, stop dragging
    this.setState({drag:null});
  }
}

function XSpacing(x){
  //convert an entry in a node like [1,0] to a coordinate on the canvas
  return (x+1)*s*2;
}
function YSpacing(y){
  return (y+1)*s*5/4;
}
function hascoord(set,coord){
  for (let s of set){
    if (equalCoords(s,coord)){
      return true;
    }
  }
  return false;
}
function equalCoords(coord1,coord2){
  for (var i = 0, l=coord1.length; i < l; i++) {
    if (coord1[i] !== coord2[i]) {
          // Warning - two different object instances will never be equal: {x:20} != {x:20}
          return false;
      }
  }
  return true;
}

function CoordStringfrom(x,y){
  let string = "";
  if(x<8){
    string += String.fromCharCode(x+65);
  } else {
    string += String.fromCharCode(x+66);
  }
  string += y+1;
  return string;
}
