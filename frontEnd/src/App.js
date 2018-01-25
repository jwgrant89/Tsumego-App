import React, { Component } from 'react';
import update from 'immutability-helper'
import './App.css';
import Goban from './boardApp.js'
import './boardApp.css'
// import Tree from './tree.js'
import GameTree from './GameTree.js'
import NavWindow from './navwindow.js'

// state will be current problem that's open,
// edit mode, autoplay mode,
class App extends Component {
  constructor(props){
    super(props);
    // let priorBlackMoves = [];
    // let priorWhiteMoves = [];
    // let node = {type:"root",priorBlackMoves:priorBlackMoves,priorWhiteMoves:priorWhiteMoves};
    // let gameTree = new Tree(node);
    const node = this.props.tree.node;
    const gameTree = this.props.tree.gameTree;
    this.state ={
      gameTree: gameTree,
      currentMove: node,
      officialGameTree: gameTree,
    }
    this.boardClick = this.boardClick.bind(this);
    this.getBoardstate = this.getBoardstate.bind(this);
    this.gameTreeClick = this.gameTreeClick.bind(this);
    this.reset = this.reset.bind(this);
    this.deleteCurrent = this.deleteCurrent.bind(this);
    this.undo = this.undo.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.save = this.save.bind(this);
    this.mark = this.mark.bind(this);
    this.setGameTree=this.setGameTree.bind(this);
    this.addDecoration =this.addDecoration.bind(this);
    this.addLabel = this.addLabel.bind(this);
  }
  componentDidMount(){
    window.addEventListener("keydown",this.keyPress);
  }
  componentWillReceiveProps(nextProps){
      // state is seeded from props, so we need to update the state
      // if the props change
      let node;
      let gameTree;
      if (nextProps.loaded !== this.props.loaded){
        if(!nextProps.loaded){
          return;
        }
        if (nextProps.tree.node){
          node = nextProps.tree.node;
        }
        if (nextProps.tree.gameTree){
          gameTree = nextProps.tree.gameTree;
        }
        if(node){
          this.setState({
            currentMove: node})
        }
        if(gameTree){
          this.setState({
            gameTree: gameTree,
            officialGameTree:gameTree})
          };
        }
        this.setState({mode:nextProps.mode});
      }
  keyPress(e){
    if(!this.props.mode.editMode && !this.props.mode.showsolution){
      return;
    }
    const gameTree = this.state.gameTree;
    const currentMove = this.state.currentMove;
    let currentNode = gameTree.has(currentMove);
    let x = currentMove.drawatx;
    let y = currentMove.drawaty;
    let findnext = function(upordown){
      let nextmove =null;
      if (upordown==="up"){
        let nexty=-1;
        gameTree.contains(function(node){
          if(node.data.drawatx === x && node.data.drawaty < y && node.data.drawaty >nexty){
            nextmove = node.data;
            nexty=nextmove.drawaty;
          }
        },gameTree.traverseBF);
      }
      if (upordown ==="down"){
        let nexty=Infinity;
        gameTree.contains(function(node){
          if(node.data.drawatx === x && node.data.drawaty > y && node.data.drawaty < nexty){
            nextmove = node.data;
            nexty=nextmove.drawaty;
          }
        },gameTree.traverseBF);
      }
      return nextmove;
    }
    switch (e.key){
      default: return;
        case "ArrowLeft" :
          if (currentMove.type ==="root"){
            return;
          }
          this.setState({currentMove: currentNode.parent.data});
          return;
        case "ArrowRight" :
          if(currentNode.children.length ===0){
            return;
          }
          this.setState({currentMove: currentNode.children[0].data});
              return;
        case "ArrowUp" :
          {let nextmove = findnext("up");
          if(nextmove){
            this.setState({currentMove: nextmove});
          }
          return;}
        case "ArrowDown" :
          {let nextmove = findnext("down");
          if(nextmove){
            this.setState({currentMove: nextmove});
          }
          return;}
    }
  }
  deleteCurrent(){
    if (window.confirm("Are you sure you want to delete this variation?") ===true){
      const gameTree = this.state.gameTree;
      const currentMove = this.state.currentMove;
      let newtree;
      let parent;
      if (currentMove.type ==="root"){
        parent = currentMove;
        newtree = gameTree.cloneTree();
        let node = newtree.has(parent);
        node.children = [];
      } else{
        newtree = gameTree.cloneTree();
        parent = gameTree.has(currentMove).parent.data;
        newtree.remove(currentMove,parent,newtree.traverseDF);
      }
      this.setState({gameTree : newtree, currentMove : parent});
    }
    else {return;};
  }

  undo(){
    const currentMove=this.state.currentMove;
    const gameTree = this.state.gameTree;
    if(currentMove.type==="root"){
      return;
    }
    let parent = gameTree.has(currentMove).parent.data;
    this.setState({currentMove:parent});
  }

  reset(){
    const gameTree=this.state.officialGameTree;
    this.setState({currentMove:gameTree.root.data,gameTree:gameTree});
  }
  // pass(){
  //   const gameTree = this.state.gameTree;
  //   const currentMove = this.state.currentMove;
  //   let colour = currentMove.colour === "black" ? "white" : "black";
  //   let currentnode = gameTree.has(currentMove);
  //   for (let i=0;i<currentnode.children.length;i++){
  //     if(currentnode.children[i].data.type === "pass"){
  //       this.setState({currentMove: currentnode.children[i].data})
  //       return;
  //     }
  //   }
  //   let pass = {type:"pass",colour:colour};
  //   let newtree = this.state.gameTree.cloneTree();
  //   newtree.add(pass,this.state.currentMove,newtree.traverseBF);
  //   this.setState({
  //     gameTree: newtree,
  //     currentMove: pass,
  //   })
  // }

  save(){
    const gameTree = this.state.gameTree;
    let node = this.state.currentMove;
    const name = this.props.tree.name;
    let treedata = {gameTree:gameTree,node:node,name:name};
    const set = this.props.currentSet;
    const problem = this.props.currentProblem;
    this.props.sendProblem(set,problem,treedata);
    this.setState({officialGameTree:gameTree});
  }

  mark(success){
    // function for recording success or failure of a variation;
    let node = this.state.currentMove;
    if (node.endstatus===success){
      return;
    }
    node.endstatus = success;
    this.save();
    this.forceUpdate();
  }

  gameTreeClick(x,y){
    const gameTree = this.state.gameTree;
    let newnode;
    gameTree.contains(function(node){
      if (node.data.drawatx === x && node.data.drawaty === y){
        newnode = node;
      }
    },gameTree.traverseBF);
    if(newnode){
      this.setState({currentMove: newnode.data});
    };
  }
  boardClick(x,y){
    //response when clicking on board
      const gameTree = this.state.gameTree;
      const currentMove = this.state.currentMove;
      const blackToPlay = gameTree.has(currentMove).depth()%2===0;
      let boardstate = this.getBoardstate(gameTree,currentMove).boardstate;
      let newTree = gameTree.cloneTree();
      let currentNode = newTree.has(currentMove);
      let response;
      let colour;
      if (currentMove.type==="root"){
        colour = "black";
      } else {
        colour = currentMove.colour === "black" ? "white" : "black";
      };
      if(x === undefined && y === undefined){
        return;
      }
      if(boardstate[x][y] !=="N"){
        return;
      }
      let move = this.makemove(x,y,boardstate, blackToPlay);
      let stone = stoneData(x,y,move.boardstate);
      if (stone.liberty_count>0){
        let newmove = {x:x, y:y,type:"move",colour:colour,decorations:{},labels:[]};
        let alreadyInTree = false;
        for (let i =0; i< currentNode.children.length;i++){
          if (currentNode.children[i].data.x === x && currentNode.children[i].data.y === y){
            alreadyInTree = true;
            newmove = currentNode.children[i].data;
          }
        }
        if(!alreadyInTree){
          newTree.add(newmove,currentMove,newTree.traverseDF);
        };
        if(blackToPlay && this.props.mode.autoplay){
          let newnode = newTree.has(newmove);
          if(newnode.children.length>0){
            let i = getRandomInt(0,newnode.children.length);
            response = newnode.children[i].data;
          }
        }
        this.setState({
          gameTree: newTree,
          currentMove : newmove
        });
      };
      return response;
    }
  makemove(x,y,boardstate,blackToPlay){
    // function assumes a move is legal, and returns the new boardstate with prisoners
    let newprisoners=0;
    let colour = blackToPlay ? "B" : "W";
    let newmoveboardstate = update(boardstate,{[x]:{[y]:{$set: colour }}});
    //move was assumed to be legal, so we can remove all ko information
    for (let i=0; i<19; i++){
      for (let j=0; j<19; j++){
        if (newmoveboardstate[i][j]==="K"){
          newmoveboardstate=update(newmoveboardstate,{[i]:{[j]:{$set: "N"}}});
        };
      };
    };
    let stone = stoneData(x,y,newmoveboardstate);
    let libs = stone.liberties;
    for (let l of libs){
      let adjacent = stoneData(l[0],l[1],newmoveboardstate);
      // check if the opponent's stones are captured by this move: no suicide moves allowed
      if(newmoveboardstate[l[0]][l[1]]!==colour && adjacent.liberty_count===0){
        //need to check if it's a ko situation. This happens if there is 1 stone in captured group and newly
        // placed stone currently has no liberties and has no other connected stones
        if (adjacent.connected_stones.size ===1 && stone.liberty_count ===0 && stone.connected_stones.size===1){
          newmoveboardstate = update(newmoveboardstate,{[l[0]]:{[l[1]]:{$set: "K" }}});
          newprisoners+=1;
        } else{
          for (let g of adjacent.connected_stones){
            newmoveboardstate = update(newmoveboardstate,{[g[0]]:{[g[1]]:{$set: "N" }}});
            newprisoners+=1;
          };
        };
      };
    };
    return {boardstate: newmoveboardstate, prisoners: newprisoners};
  }

  getBoardstate(gametree,move){
    let boardstate = Array(19).fill(Array(19).fill("N"));
    let prisoners = {black:0, white:0};
    const node = gametree.has(move);
    const history = gametree.parents(node.data);
    const priorBlackMoves = gametree.root.data.priorBlackMoves;
    const priorWhiteMoves = gametree.root.data.priorWhiteMoves;
    let self = this;
    // add any stones on the default boardstate
    for (let i=0;i<priorBlackMoves.length;i++){
      let move = self.makemove(priorBlackMoves[i].x,priorBlackMoves[i].y,boardstate,true);
      boardstate = move.boardstate;
    }
    for (let i=0;i<priorWhiteMoves.length;i++){
      let move = self.makemove(priorWhiteMoves[i].x,priorWhiteMoves[i].y,boardstate,false);
      boardstate = move.boardstate;
    }
    // add each move in turn from history
    history.contains(function(eachmove){
      if(eachmove.data.type ==="move"){
        // add the additional moves on the node
        let blackmoves = eachmove.data.decorations.blackmoves;
        if(blackmoves){
          for(let i=0;i<blackmoves.length;i++){
            let move = self.makemove(blackmoves[i].x,blackmoves[i].y,boardstate,true);
            boardstate = move.boardstate;
            prisoners.black += move.prisoners;
          }
        }
        let whitemoves = eachmove.data.decorations.whitemoves;
        if(whitemoves){
          for(let i=0;i<whitemoves.length;i++){
            let move = self.makemove(whitemoves[i].x,whitemoves[i].y,boardstate,false);
            boardstate=move.boardstate;
            prisoners.white+= move.prisoners;
          }
        }
        let colour = eachmove.data.colour;
        let move = self.makemove(eachmove.data.x,eachmove.data.y,boardstate,colour === "black");
        boardstate = move.boardstate;
        prisoners[colour] = prisoners[colour] + move.prisoners;
      }
    },history.traverseBF);
    return {boardstate: boardstate,prisoners:prisoners};
  }
  setGameTree(tree){
    this.setState({gameTree:tree});
  }

  addDecoration(decoration,x,y){
    //add a decoration at position (x,y) for this move;
    let currentMove = this.state.currentMove;
    // does this have a decoration property? if not, create it.
    currentMove.decorations = currentMove.decorations || {};
    // does the property decorations yet have a property containing the list of this decoration?
    //if not, create it
    currentMove.decorations[decoration] = currentMove.decorations[decoration] || [];
    // is there already a decoration? if so, delete it;
    for(let d in currentMove.decorations){
      for(let e of currentMove.decorations[d]){
        if(e.x===x && e.y===y){
          let index = currentMove.decorations[d].indexOf(e);
          currentMove.decorations[d].splice(index,1);
          //if our action is a different decoration, the add it.
          if(d!==decoration){
            currentMove.decorations[decoration].push({x:x,y:y});
          }
          this.setState({currentMove:currentMove});
          return;
        }
      }
    }
    // otherwise, add it
    currentMove.decorations[decoration].push({x:x,y:y});
    this.setState({currentMove:currentMove});
    return;
  }

  addLabel(label,x,y){
    //add a label to the currentmove at position (x,y)
    //labels is an array that is a property of currentMove
    //elements in the array are [{x:x,y:y},l], denoting
    // a label at (x,y) with value "l".
    let currentMove = this.state.currentMove;
    //check if labels property exists, create it if not;
    currentMove.labels = currentMove.labels || [];
    //is there already a label at (x,y)? if so, remove it
    for (let l of currentMove.labels){
      if(l[0].x===x && l[0].y===y){
        let index = currentMove.labels.indexOf(l);
        currentMove.labels.splice(index,1);
        this.setState({currentMove:currentMove});
        return;
      }
    }
    let newlabel = [{x:x,y:y},label];
    currentMove.labels.push(newlabel);
    this.setState({currentMove:currentMove});
  }
  render() {
    let boardstate = this.getBoardstate(this.state.gameTree,this.state.currentMove);
    let blackToPlay = this.state.gameTree.has(this.state.currentMove).depth()%2===0;
    return (
      <div className="main">
        <div id = "wrapper" ref="wrapper" tabIndex="0">
          <Goban
            boardClick = {this.boardClick}
            boardstate = {boardstate.boardstate}
            currentMove={this.state.currentMove}
            blackToPlay = {blackToPlay}
            autoplayspeed={this.props.autoplayspeed}
            nextProblem={this.props.nextProblem}
            mode = {this.props.mode}
            reset = {this.reset}
            addDecoration={this.addDecoration}
            addLabel={this.addLabel} />
          <Right
            currentProblem={this.props.currentProblem}
            currentSet={this.props.currentSet}
            problemSets={this.props.problemSets}
            gameTree={this.state.gameTree}
            currentMove ={this.state.currentMove}
            undo = {this.undo}
            gameTreeClick={this.gameTreeClick}
            reset = {this.reset}
            save ={this.save}
            mark = {this.mark}
            deleteCurrent = {this.deleteCurrent}
            nextProblem = {this.props.nextProblem}
            prevProblem = {this.props.prevProblem}
            prisoners = {boardstate.prisoners}
            selectProblem={this.props.selectProblem}
            mode={this.props.mode}
            autoplayspeed={this.props.autoplayspeed}
            changeautoplayspeed = {this.props.changeautoplayspeed}
            togglemode={this.props.togglemode}
            solutionsIndex={this.props.solutionsIndex}
            keyPress={this.keyPress}
            setGameTree={this.setGameTree}/>
        </div>
      </div>
    );
  }
}

class Right extends Component{
  constructor(){
    super();
    this.state ={navwindowopen: false,userwindowopen:false};
    this.toggleVisible = this.toggleVisible.bind(this);
    this.menuClick=this.menuClick.bind(this);
    this.changeModeHandler = this.changeModeHandler.bind(this);
  }
  render(){
    if(this.state.navwindowopen || this.state.userwindowopen){
      return(
        <div id="right">
          <NavWindow
            userwindowopen={this.state.userwindowopen}
            navwindowopen = {this.state.navwindowopen}
            toggleVisible={this.toggleVisible}
            currentProblem={this.props.currentProblem}
            currentSet={this.props.currentSet}
            problemSets={this.props.problemSets}
            selectProblem={this.props.selectProblem}
            menuClick={this.menuClick}
            mode = {this.props.mode}
            togglemode={this.changeModeHandler}
            autoplayspeed={this.props.autoplayspeed}
            changeautoplayspeed={this.props.changeautoplayspeed}
            solutionsIndex={this.props.solutionsIndex}/>
        </div>
      )
    }  else {
      if(this.props.mode.editMode || this.props.mode.showsolution){
        return(
        <div id="right">
          <NavWindow
            userwindowopen={this.state.userwindowopen}
            navwindowopen = {this.state.navwindowopen}
            toggleVisible={this.toggleVisible}
            currentProblem={this.props.currentProblem}
            currentSet={this.props.currentSet}
            problemSets={this.props.problemSets}
            mode = {this.props.mode}
            solutionsIndex={this.props.solutionsIndex}/>
          <div id="commentbox">
            <Commentbox ref="commentbox"
            comment = {this.props.currentMove.comment}
            currentMove={this.props.currentMove}
            gameTree = {this.props.gameTree}
            editmode={this.props.mode.editMode}
            keyPress={this.props.keyPress} />
          </div>
          <GameTree ref ="gametree"
            gameTree={this.props.gameTree}
            currentMove= {this.props.currentMove}
            gameTreeClick = {this.props.gameTreeClick}
            mode = {this.props.mode}
            setGameTree={this.props.setGameTree}/>
          <div id="tools">
            <Buttons
              undo = {this.props.undo}
              reset = {this.props.reset}
              deleteCurrent = {this.props.deleteCurrent}
              nextProblem = {this.props.nextProblem}
              prevProblem = {this.props.prevProblem}
              save = {this.props.save}
              mark = {this.props.mark}
              mode = {this.props.mode}
              togglemode ={this.changeModeHandler}/>
          </div>
        </div>)} else {
          return(
          <div id="right">
            <NavWindow
              userwindowopen={this.state.userwindowopen}
              navwindowopen = {this.state.navwindowopen}
              toggleVisible={this.toggleVisible}
              currentProblem={this.props.currentProblem}
              currentSet={this.props.currentSet}
              problemSets={this.props.problemSets}
              mode = {this.props.mode}
              solutionsIndex={this.props.solutionsIndex}/>
            <div id="commentbox">
              <Commentbox ref="commentbox"
                currentMove={this.props.currentMove}
                gameTree = {this.props.gameTree}
                editmode={this.props.mode.editMode} />
            </div>
            <div id="tools">
              <Buttons
                undo = {this.props.undo}
                reset = {this.props.reset}
                deleteCurrent = {this.props.deleteCurrent}
                nextProblem = {this.props.nextProblem}
                prevProblem = {this.props.prevProblem}
                save = {this.props.save}
                mark = {this.props.mark}
                mode = {this.props.mode}
                togglemode ={this.changeModeHandler}/>
            </div>
          </div>)
      }
    }
  }
  changeModeHandler(option){
    if(option==="autoplay"){
      this.props.reset();
    }
    this.props.togglemode(option);
    return;
  }
  toggleVisible(option){
    let newstatus = !this.state[option];
    let object ={};
    object[option] = newstatus;
    this.setState(object);
  }
  menuClick(selectedSet,j){
    this.props.selectProblem(selectedSet,j);
    this.setState({navwindowopen:false});
  }
}

// class UserWindow extends Component {
//   render(){
//     if(this.props.menuopen){
//       <div className = "navWindow">
//
//     } else {
//
//     }
//   }
// }

// class NavWindow extends Component {
//   constructor(props){
//     super(props);
//     this.numberPerPage = 60;
//     const currentSet = this.props.currentSet;
//     const currentProblem=this.props.currentProblem;
//     let page = Math.floor(Number(currentProblem)/this.numberPerPage);
//     this.state={selectedSet:currentSet,page:page};
//     this.clickSelector = this.clickSelector.bind(this);
//   }
//   // componentDidMount(){
//   //   // make sure the correct set is selected in the dropdown
//   //   if(this.props.menuopen){
//   //     let selector = document.getElementById("setSelection");
//   //     for(let i=0;i<selector.options.length;i++){
//   //       if(selector.options[i].value===this.props.currentSet){
//   //         selector.selectedIndex = i;
//   //       }
//   //     }
//   //   };
//   // }
//   render(){
//     const currentProblem = this.props.currentProblem;
//     const currentSet = this.props.currentSet;
//     const problemSets = this.props.problemSets;
//     let options = Object.keys(problemSets).map((problemset) => <option key={problemset} value={problemset}>{problemSets[problemset].name}</option>);
//     let buttons = [];
//     let startindex = this.state.page*this.numberPerPage+1;
//     let endindex = Math.min((this.state.page+1)*this.numberPerPage+1,problemSets[this.state.selectedSet].size);
//     for(let i=0;i<endindex-startindex;i++){
//       let j=i+startindex;
//       let newbutton= <MenuButton index={j} menuClick={() =>{this.props.menuClick(this.state.selectedSet,j)}}/>;
//       buttons.push(newbutton);
//     }
//     if(!this.props.menuopen){
//       return(
//         <div id="menubuttonoutside">
//           <button onClick={this.props.toggleVisible} className="buttons">Show Menu</button>
//         </div>
//       )
//     } else {
//       let thing = "thing";
//       return(
//         <div className = "navWindow" >
//           <div id="menubuttoninside">
//           <select id="setSelection" onChange={this.clickSelector} value={this.state.selectedSet}>
//               {options}
//           </select>  <button id = "insidebutton" onClick={this.props.toggleVisible} className="buttons">Hide Menu</button>
//           </div>
//           <div className= "menucontents">
//             {buttons}
//           </div>
//           <div className="navButtons">
//           </div>
//         </div>
//       )
//     }
//   }
//   clickSelector(event){
//     this.setState({selectedSet:event.target.value})
//   }
//
// }
//
// class MenuButton extends React.Component{
//   constructor(){
//     super();
//   }
//   render(){
//     return(
//       <div
//         className="problemButton"
//         key={this.props.index}
//         onClick={()=>this.props.menuClick(this.props.index)}>
//           {this.props.index}
//         </div>)
//   }
// }

class Commentbox extends Component{
  constructor(props){
    super(props);
    this.state = {contents:this.props.currentMove.comment};
    this.handleChange = this.handleChange.bind(this);
    this.disableKeyListener=this.disableKeyListener.bind(this);
    this.reenableKeyListener=this.reenableKeyListener.bind(this);
  }
  shouldComponentUpdate(nextProps,nextState){
    // let bool= this.props.gameTree!==undefined && (nextProps.currentMove!==this.props.currentMove || nextState!==this.state);
    return nextProps.currentMove!==this.props.currentMove || nextState.contents!==this.state.contents;
  }
  componentWillReceiveProps(nextProps){
    //if we are at the root of a problem and there are no children, then no solutions
    //have been saved, so let the user know
    if(nextProps.currentMove.type ==="root" && nextProps.gameTree.root.children.length===0){
      this.setState({contents:"No solution given"});
      return;
    }
    //if there is a comment, display it
    if(nextProps.currentMove.comment){
      this.setState({contents:nextProps.currentMove.comment});
      return;
    }
    //if player made a move that was not in a saved variation of the game tree, tell them
    if(!nextProps.currentMove.endstatus && nextProps.gameTree.has(nextProps.currentMove).children.length===0){
      this.setState({contents:"Unknown variation"});
      return;
    }
    this.setState({contents:""});
    return;
  }
  disableKeyListener(){
    //when the focus is on the comment box, we want to be able to use the
    //arrow keys as normal, so switch off the event listener that moves
    //the game tree when arrow keys are pressed
    window.removeEventListener("keydown",this.props.keyPress);
  }
  reenableKeyListener(){
    //when the focus leaves the comment box, reenable the removed listener event
    window.addEventListener("keydown",this.props.keyPress);
  }
  render(){
    let opts = {};
    //textarea is in read-only mode unless editmode is enabled
    if (!this.props.editmode){
      opts.readOnly = "readOnly";
    }
    return(
      <textarea rows="4" cols="50"
        onFocus={this.disableKeyListener}
        onBlur={this.reenableKeyListener}
        value = {this.state.contents}
        onChange={this.handleChange}
        {...opts}>
      </textarea>
    );
  }
  handleChange(e){
    this.props.currentMove.comment = e.target.value;
    this.setState({contents:e.target.value});
  }
}

class Buttons extends React.Component{
  constructor(props){
    super(props);
    this.state = {mode:this.props.mode};
  }
  componentWillReceiveProps(nextProps){
    this.setState({mode:nextProps.mode});
  }
  render(){
    if(this.props.mode.editMode){
      return(
        <div id="buttons">
          <div id="localbuttons">

            <button type = "button" ref="undo" className= "buttons" onClick= {this.props.undo}>Undo </button>
            <button type="button" ref="reset" className="buttons" onClick={this.props.reset}>Reset</button>
            <button type="button" ref="saveS" className="buttons" onClick={() => {this.props.save()}}>Save</button>
            <button type="button" ref="success" className="buttons" onClick={() => {this.props.mark("S")}}>Mark Successful </button>
            <button type="button" ref="failure" className="buttons" onClick={() => {this.props.mark("F")}}>Mark Failure </button>
            <button type = "button" ref = "deleteCurrent" className = "buttons" onClick = {this.props.deleteCurrent}> Delete Current </button>
          </div>

          <div id="nextandprevious">
            <button type = "button" ref="prevproblem" className= "leftarrow" onClick = {this.props.prevProblem}></button>
            <button type = "button" ref="nextproblem" className = "rightarrow" onClick = {this.props.nextProblem}> </button>
          </div>
        </div>
      );
    } else {
      return(
        <div id="buttons">
          <div id="localbuttons">
            <button type = "button" ref="undo" className= "buttons" onClick= {this.props.undo}>Undo </button>
            <button type="button" ref="reset" className="buttons" onClick={this.props.reset}>Reset</button>
            <button type="button" ref="showsolution" className="buttons"
              onClick = {() => {this.props.togglemode("showsolution")}}>Show Solution</button>
          </div>

          <div id="nextandprevious">
            <button type = "button" ref="prevproblem" className= "leftarrow" onClick = {this.props.prevProblem}></button>
            <button type = "button" ref="nextproblem" className = "rightarrow" onClick = {this.props.nextProblem}> </button>
          </div>
        </div>
      );
    }
  };
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

function hascoord(set,coord){
  for (let s of set){
    if (equalCoords(s,coord)){
      return true;
    }
  }
  return false;
}

function union(set1,set2){
  for (let s of set1){
    if (!hascoord(set2,s)){
      set2.add(s);
    };
  };
  return set2;
};

function difference(set1,set2){
  for (let s of set1){
    if (hascoord(set2,s)){
      set1.delete(s);
    }
  }
  return set1;
}

function stoneData(a,b,boardstate){
  // liberties is immediate adjacent coords
  // same_surrounding_colour is the set of coordinates adjacent to (a,b) with the same colour
  // connected_stones is the set of coords that are connected to (a,b) by coords of the same colour
  // boundary is the empty spaces adjacent to the connected group
  // liberty count is the size of the boundary;
  function liberties(a,b){
    let libs = new Set();
    if (a!==0){
      libs.add([a-1,b]);
    }
    if (a!==18){
      libs.add([a+1,b]);
    }
    if (b!==0){
      libs.add([a,b-1]);
    }
    if (b!==18){
      libs.add([a,b+1]);
    }
    return libs;
  };
  function same_surrounding_colour(a,b,newmoveboardstate){
    if(newmoveboardstate[a][b] === "N" || newmoveboardstate[a][b] ==="K"){
      return new Set();
    };
    let nearby = new Set();
    for (let liberty of liberties(a,b)){
      if (newmoveboardstate[liberty[0]][liberty[1]] ===newmoveboardstate[a][b]){
        nearby.add(liberty);
      };
    };
    return nearby;
  };
  function connected_stones(a,b,newmoveboardstate){
    let group = new Set();
    if (newmoveboardstate[a][b] === "N" || newmoveboardstate[a][b] === "K"){
      return group;
    };
    group = group.add([a,b]);
    let outside = same_surrounding_colour(a,b,newmoveboardstate);
    while (outside.size !==0){
      group = union(group,outside);
      outside = new Set();
      for (let i of group){
        outside = difference(union(outside,same_surrounding_colour(i[0],i[1],newmoveboardstate)),group);
      };
    };
    return group;
  };
  function boundary(a,b,newmoveboardstate){
    let group = connected_stones(a,b,newmoveboardstate);
    let bound = new Set();
    for (let g of group){
      bound = union(bound,liberties(g[0],g[1]));
    };
    bound = difference(bound,group);
    return bound;
  };

  function liberty_count(a,b,newmoveboardstate){
    let libs =0;
    let bound = boundary(a,b,newmoveboardstate);
    if (bound.size ===0){
      return libs;
    }
    for (let h of bound){
      if (newmoveboardstate[h[0]][h[1]] === "N" || newmoveboardstate[h[0]][h[1]] === "K"){
        libs +=1;
      };
    };
    return libs;
  };
  let data = {liberties: liberties(a,b),
              same_surrounding_colour: same_surrounding_colour(a,b,boardstate),
              connected_stones: connected_stones(a,b,boardstate),
              boundary: boundary(a,b,boardstate),
              liberty_count: liberty_count(a,b,boardstate)}
  return data;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}





export default App;
