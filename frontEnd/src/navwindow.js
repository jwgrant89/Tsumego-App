import React, { Component } from 'react';
import './navWindow.css'
import './toggleSwitches.css'

export default class NavWindow extends Component {
  constructor(props){
    super(props);
    this.numberPerPage = 30;
    const currentSet = this.props.currentSet;
    const currentProblem=this.props.currentProblem;
    let page = Math.floor(Number(currentProblem)/this.numberPerPage);
    const editmode = this.props.mode.editMode;
    const autoplay = this.props.mode.autoplay;
    this.state={
      selectedSet:currentSet,
      page:page,
      editmode:editmode,
      autoplay:autoplay};
    this.clickSelector = this.clickSelector.bind(this);
    this.nextPage= this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
    this.handleMenuClick = this.handleMenuClick.bind(this);
    this.openorclosemenu = this.openorclosemenu.bind(this);
  }
  // componentDidMount(){
  //   // make sure the correct set is selected in the dropdown
  //   if(this.props.menuopen){
  //     let selector = document.getElementById("setSelection");
  //     for(let i=0;i<selector.options.length;i++){
  //       if(selector.options[i].value===this.props.currentSet){
  //         selector.selectedIndex = i;
  //       }
  //     }
  //   };
  // }
  render(){
    const problemSets = this.props.problemSets;
    let options = Object.keys(problemSets).map((problemset) => <option key={problemset} value={problemset}>{problemSets[problemset].name}</option>);
    let buttons = [];
    let startindex = this.state.page*this.numberPerPage+1;
    let endindex = Math.min((this.state.page+1)*this.numberPerPage+1,problemSets[this.state.selectedSet].size);


    for(let i=0;i<endindex-startindex+1;i++){
      let j=i+startindex;
      let newbutton = <MenuButton
                        key={j}
                        index={j}
                        menuClick={this.handleMenuClick}
                        selected ={j===Number(this.props.currentProblem)}
                        solved = {this.props.solutionsIndex[String(j)]}/>;
      buttons.push(newbutton);
    }
    if(!this.props.navwindowopen && !this.props.userwindowopen){
      return(
        <div id="menubuttonoutside">
          <button id = "usermenubutton" onClick={()=>{this.props.toggleVisible("userwindowopen")}} className = "buttons">Show Profile </button>
          <button id="navbutton" onClick={this.openorclosemenu} className="buttons">Show Menu</button>
        </div>
      )
    } else if(this.props.navwindowopen){
      return(
        <div className = "navWindow" >
          <div className="menubuttoninside">
          <select id="setSelection" onChange={this.clickSelector} value={this.state.selectedSet}>
              {options}
          </select>  <button id = "insidebutton" onClick={this.openorclosemenu} className="buttons">Hide Menu</button>
          </div>
          <div className= "menucontents">
            {buttons}
          </div>
          <div className="navButtons">
          <button type = "button" ref="prevpage" className= "leftarrow" onClick = {this.prevPage}></button>
          <button type = "button" ref="nextpage" className = "rightarrow" onClick = {this.nextPage}> </button>
          </div>
        </div>
      )
    } else {
      let editopts = {};
      let autoplayopts = {};
      if (this.state.editmode){
        editopts.checked = "checked";
      }
      if (this.state.autoplay){
        autoplayopts.checked = "checked";
      }
      return(
        <div className="navWindow">
          <div className= "menubuttoninside">
            <button
            id="userinsidebutton"
            onClick={() => {this.props.toggleVisible("userwindowopen")}}
            className="buttons"> Hide Profile </button>
          </div>
          <div className = "userwindowcontents">
            <ul>
              <li/> Edit mode : <label className = "switch">
                <input type="checkbox" onChange={() => {this.props.togglemode("editMode")}} checked={this.props.mode.editMode}/>
                <span className = "slider"/>
                </label>
            <li/> Autoplay mode : <label className = "switch">
              <input type="checkbox" onChange={() => {this.props.togglemode("autoplay")}} checked={this.props.mode.autoplay}/>
              <span className = "slider"/>
              </label>
            <li/> <input type="range" value = {- this.props.autoplayspeed} min = {-400} max ={0} onChange={(evt) => {this.props.changeautoplayspeed(evt.target.value)}}/>
            </ul>
          </div>
        </div>
      )
    }
  }
  openorclosemenu(){
    const currentSet = this.props.currentSet;
    const currentProblem=this.props.currentProblem;
    let page = Math.floor(Number(currentProblem)/this.numberPerPage)
    this.props.toggleVisible("navwindowopen");
    this.setState({selectedSet:currentSet,page:page})
  }
  handleMenuClick(j){
    this.props.menuClick(this.state.selectedSet,j)
  }
  clickSelector(event){
    this.props.selectProblem(event.target.value,1);
    this.setState({selectedSet:event.target.value,page:0})
  }
  nextPage(){
    const problemSets = this.props.problemSets;
    const currentSet = this.props.currentSet;
    const page = this.state.page;
    if ((page+2)*this.numberPerPage>problemSets[currentSet].size){
      return;
    }
    this.setState((prevState) => {return {page: prevState.page+1}});
  }
  prevPage(){
    const page = this.state.page;
    if (page===0){
      return;
    }
    this.setState((prevState) => {return {page: prevState.page-1}});
  }
}

class MenuButton extends React.Component{
  render(){
    let classname = "problemButton";
    if (this.props.selected){
      classname += " selected";
    }
    if (this.props.solved){
      classname += " solved";
    }
    return(
      <div
        className={classname}
        key={this.props.index}
        onClick={()=>this.props.menuClick(this.props.index)}>
          {this.props.index}
        </div>)
  }
}
