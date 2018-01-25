import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import getTreeFromSGF from './sgfReader.js'
import writeSGF from './sgfWriter.js'
import Tree from './tree.js'
import update from 'immutability-helper'

//TODo:
//  rewrite make move so that it is a node method?
// change currentMove to the node rather than the data?
// ability to add labels and decorations in edit mode DONE;
// somehow make the gametree scroll jump less jarring


// const problemSetSizes = {LD1: 900, LD2: 861, LD3: 792}

class Index extends Component{
  constructor(){
    super();
    const problemSets = {
      LD1 :{name: "Cho Chikun's Elementary Life and Death", size: 900,path:"/ChoChikunLD1/Cho_Chikun_LD1_"},
      LD2:{name:"Cho Chikun's Intermediate Life and Death", size:861,path:"/ChoChikunLD2/Cho_Chikun_LD2_"},
      LD3:{name:"Cho Chikun's Advanced Life and Death", size:792,path:"/ChoChikunLD3/Cho_Chikun_LD3_"}
    }
    let priorBlackMoves = [];
    let priorWhiteMoves = [];
    this.serverPath = "http://localhost:3001/";
    const solutionsIndex = {"1":false};
    let currentProblem = localStorage.getItem('currentProblem')!==null? localStorage.getItem('currentProblem'):"0001";
    let currentSet =localStorage.getItem('currentSet')!==null?localStorage.getItem('currentSet'):"LD1";
    this.node = {type:"root",priorBlackMoves:priorBlackMoves,priorWhiteMoves:priorWhiteMoves,decorations:{},labels:[],comment:""};
    this.gameTree = new Tree(this.node);
    this.tree = {gameTree:this.gameTree,node:this.node,name:null}
    this.state = {
      solutionsIndex:solutionsIndex,
      problemSets: problemSets,
      currentSet: currentSet,
      currentProblem:currentProblem,
      mode: {editMode:false,
            autoplay:true,
            showsolution:false},
      autoplayspeed:200,
      loaded: false,
    }
    this.getProblem = this.getProblem.bind(this);
    this.nextProblem = this.nextProblem.bind(this);
    this.prevProblem = this.prevProblem.bind(this);
    this.selectProblem = this.selectProblem.bind(this);
    this.sendProblem = this.sendProblem.bind(this);
    this.togglemode=this.togglemode.bind(this);
    this.changeautoplayspeed=this.changeautoplayspeed.bind(this);
    this.getSolutionIndex=this.getSolutionIndex.bind(this);
  }

  componentDidMount(){
    this.getSolutionIndex(this.state.currentSet);
    this.getProblem(this.state.currentSet,this.state.currentProblem);
    // this.selectProblem(this.state.currentSet,6);
  }
  componentWillUpdate(nextProps,nextState){
    if (nextState.currentSet !== this.state.currentSet){
      this.getSolutionIndex(nextState.currentSet);
    }
  }
  render(){
    return(
      <App
        tree={this.tree}
        selectProblem = {this.selectProblem}
        nextProblem={this.nextProblem}
        prevProblem={this.prevProblem}
        loaded={this.state.loaded}
        problemSets ={this.state.problemSets}
        currentProblem={this.state.currentProblem}
        currentSet={this.state.currentSet}
        sendProblem={this.sendProblem}
        mode = {this.state.mode}
        autoplayspeed={this.state.autoplayspeed}
        changeautoplayspeed={this.changeautoplayspeed}
        togglemode={this.togglemode}
        solutionsIndex={this.state.solutionsIndex}/>
    )
  }
  nextProblem(){
    let self=this;
    if(self.state.mode.editMode){
      if(!window.confirm("Leave page without saving changes?")){
        return;
      }
    }
    let problemnumber = Number(self.state.currentProblem);
    if (problemnumber===this.state.problemSets[self.state.currentSet].size){
      return;
    }
    problemnumber+=1;
    let newstring = String(problemnumber);
    while(newstring.length<4){
      newstring= "0" + newstring;
    }
    let newmode = update(self.state.mode,{showsolution:{$set:false}});
    self.setState({currentProblem:newstring,loaded:false,mode:newmode});
    self.getProblem(self.state.currentSet,newstring);
    localStorage.setItem('currentProblem',newstring);
  }
  prevProblem(){
    if(this.state.mode.editMode){
      if(!window.confirm("Leave page without saving changes?")){
        return;
      }
    }
    let problemnumber = Number(this.state.currentProblem);
    if (problemnumber===1){
      return;
    }
    problemnumber-=1;
    let newstring = String(problemnumber);
    while(newstring.length<4){
      newstring= "0" + newstring;
    }
    let newmode = update(this.state.mode,{showsolution:{$set:false}});
    this.setState({currentProblem:newstring,loaded:false,mode:newmode});
    this.getProblem(this.state.currentSet,newstring);
    localStorage.setItem('currentProblem',newstring);
  }
  getProblem(set,problem){
    let path = this.serverPath.slice(0,-1) + this.state.problemSets[set].path;
    let filename = path + problem + ".sgf";
    let self=this;
    fetch(filename, {
      headers : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }}).then(function(response){
      return response.text();
    }).then(function(text){
      let tree = getTreeFromSGF(text);
      self.gameTree = tree.gameTree;
      self.node = tree.node;
      self.tree = tree;
      self.setState({loaded:true});
    }).catch(function(err){console.log(err)});
  }
  selectProblem(set,n){
    if(this.state.mode.editMode){
      if(!window.confirm("Leave page without saving changes?")){
        return;
      }
    }
    let newstring = n.toString();
    while(newstring.length<4){
      newstring = "0" + newstring;
    }
    let newmode = update(this.state.mode,{showsolution:{$set:false}});
    this.setState({currentProblem:newstring,currentSet:set,loaded:false,mode:newmode});
    this.getProblem(set,newstring);
    localStorage.setItem('currentProblem',newstring);
    localStorage.setItem('currentSet',set);
  }
  sendProblem(set,problem,treedata){
    // mark whether the problem is solved in our index
    let solution = treedata.gameTree.root.children.length>0? true:false;
    let newsolutionsindex = update(this.state.solutionsIndex,{[Number(problem)]:{$set: solution}});
    this.setState({solutionsIndex:newsolutionsindex});
    //prepare the message for the server
    let string = writeSGF(treedata);
    let path = this.state.problemSets[set].path;
    let filename = "problems" + path + problem + '.sgf';
    //save the problem sgf file
    fetch(this.serverPath,{method:"POST",
    body:JSON.stringify({string: string,filename:filename}),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    }).then(function(res){console.log(res)}).catch(function(err){console.log(err)});
    //save the solutionsIndex
    fetch(this.serverPath,{method:"POST",
    body:JSON.stringify({string:JSON.stringify(this.state.solutionsIndex),filename:"problems/ChoChikun" + this.state.currentSet + "/solutionsIndex.txt"}),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    }).then(function(res){console.log(res)}).catch(function(err){console.log(err)});
  }
  togglemode(option){
    const mode = this.state.mode;
    let setting = !mode[option];
    let newmode = update(mode,{[option]:{$set:setting}});
    if (option ==="editMode" && setting){
      newmode = update(newmode,{"autoplay":{$set:false}});
    };
    this.setState({mode:newmode});
  }
  changeautoplayspeed(n){
    this.setState({autoplayspeed: -n});
  }
  getSolutionIndex(set){
    let path = this.serverPath + "ChoChikun" + set + "/solutionsIndex.txt";
    let self=this;
    fetch(path, {
      headers : {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }}).then(function(response){return response.json()}).then(
      function(json){
        self.setState({solutionsIndex:json});
      }
    ).catch(function(err){console.log(err)});
  }
}

ReactDOM.render(<Index />, document.getElementById('root'));
registerServiceWorker();
