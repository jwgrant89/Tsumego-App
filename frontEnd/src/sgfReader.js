import Tree from "./tree.js"
// let teststring = "(;GM[1]FF[4]C[Hi]CA[UTF-8]AP[Sabaki:0.31.3]KM[6.5]SZ[19]AB[kk][kf][gh]AW[jk][og][gl];B[qk](;W[nn]SQ[nk][ol]TR[nl]MA[ok]CR[pl];B[pi]LB[pp:A][pq:1][qp:B][qq:2])(;W[qo]AB[aa]PL[W];W[ab]))"
// let teststring = "(;GM[1]FF[4]CA[UTF-8]RU[Japanese]SZ[19]KM[0.00]PW[white]PB[black]C[Cho Chikun's Life and Death - 1 / 0001]AW[da][ab][bb][cb][db]AB[eb][fb][bc][cc][dc][be](;B[ef];W[aa](;B[kj])(;B[qj];W[ss]))(;B[bb](;W[kk];B[lf];W[ij])(;W[rr]))))"
// teststring = "(;GM[1]FF[4]CA[UTF-8]RU[Japanese]SZ[19]KM[0.00]PW[white]PB[black]C[Cho Chikun's Life and Death - 1 / 0001]AW[da][ab][bb][cb][db]AB[eb][fb][bc][cc][dc][be])"
// teststring = "(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.31.2]KM[6.5]SZ[19]AB[kk][kf][gh]AW[jk][og][gl];B[qk](;W[nn];B[pi];PL[W]AW[ra][sa])(;W[qo]))"
const frontmatterkeys =
{
  blackmoves:/AB((?:\[[a-z][a-z]\])*)/,
  whitemoves:/AW((?:\[[a-z][a-z]\])*)/,
  name:/C\[(.*?)\]/,
}

const movedecorations=
  {
    triangle:/TR(?:\[([a-z][a-z])\])*/,
    cross: /MA(?:\[([a-z][a-z])\])*/,
    square: /SQ(?:\[([a-z][a-z])\])*/,
    circle: /CR(?:\[([a-z][a-z])\])*/,
    blackmoves: /AB(?:\[([a-z][a-z])\])*/,
    whitemoves: /AW(?:\[([a-z][a-z])\])*/,
  }

function getTreeFromSGF(string){
  // string=teststring;
  //remove all line breaks
  string = string.replace(/\r?\n|\r/g,"");
  // front matter contains all game info stuff, like prior moves;
  let frontmatter = "";
  if (/(^\(;.*?)(?:\(;|\)|;)/.test(string)){
    frontmatter = string.match(/(^\(;.*?)(?:\(;|\)|;)/)[1];
  }
  // everything else is the data of the moves played in the game;
  let gamemoves = string.replace(frontmatter,"");
  let name = ""
  if(frontmatterkeys.name.test(frontmatter)){
    name = string.match(frontmatterkeys.name)[1];
  }
  //find all the prior black moves from the front matter
  // let blackRegex = new RegExp (/AB((?:\[[a-z][a-z]\])*)/);
  let blackmovearray=[];
  if (frontmatterkeys.blackmoves.test(frontmatter)){
    blackmovearray = frontmatterkeys.blackmoves.exec(frontmatter)[1].match(/[a-z][a-z]/g);
  }
  blackmovearray = blackmovearray.map(ConvertCoordsfromString);
  // find all white moves from the front matter;
  let whitemovearray = [];
  if(frontmatterkeys.whitemoves.test(frontmatter)){
    whitemovearray=frontmatterkeys.whitemoves.exec(frontmatter)[1].match(/[a-z][a-z]/g);
  }
  whitemovearray = whitemovearray.map(ConvertCoordsfromString);
  // initialise the game tree from this data;
  let node = {type:"root",priorBlackMoves:blackmovearray,priorWhiteMoves:whitemovearray,decorations:{},labels:[],comment:""};
  let gameTree = new Tree(node);
  function recurse(string,node){
    if (string.match(/;/)===null){
      return;
    }
    if (string.charAt(0)==="("){
      //there is more than one variation;
      let startindex =1;
      let count=1;
      let variations = [];
      let length = string.length;
      for(let i=1;i<length;i++){
        if (string.charAt(i) ==="("){
          count+=1;
        }
        if(string.charAt(i)===")"){
          count-=1;
        };
        if(count===0){
          // we found the closing parenthsis
          let newvariation=string.slice(startindex,i);
          variations.push(newvariation);
          startindex=i+2;
        }
      }
      // let total = variations.length;
      // let thisnode = node;
      let total = variations.length;
      for(let i=0;i<total;i++){
        recurse(variations[i],node);
      }
    }
    else{
      //only one move, so let's make it
      // find first thing in the right form;
      // let movedata = string.match(/(;(?:B|W)\[[a-z][a-z]\])(?:C\[(.*?)\])?/);
      let movedata = /((;(?:B|W)\[[a-z][a-z]\])(.*?))(?:;|\)|\(;|$)/.exec(string);
      // the move is remembered at index 2, extra info at index 3
      // whole move information at index 0;
      let move = movedata[2];
      let info = movedata[3];
      let decorations = {};
      for (let key in movedecorations){
        if (movedecorations[key].test(info)){
          decorations[key] =info.match(movedecorations[key])[0].match(/[a-z][a-z](:.*)?/g).map(ConvertCoordsfromString);
        }
      }
      let labels = [];
      if (/LB/.test(info)){
        labels = info.match(/LB(\[[a-z][a-z]:(.*?)\])*/)[0].match(/\[[a-z][a-z]:(.*?)\]/g);
        for (let i=0;i<labels.length;i++){
          let coord = ConvertCoordsfromString(labels[i].match(/[a-z][a-z]/)[0]);
          let label = labels[i].match(/[a-z][a-z]:(.*?)\]/)[1];
          let obj =[];
          obj[0] = coord;
          obj[1]=label;
          labels[i] = obj;
        }
      }
      let comment ="";
      if(/C\[(.*?)\]/.test(info)){
        comment = info.match(/C\[(.*?)\]/)[1];
      }
      // let decorations ={square:[],triangle:[],cross:[],circle:[],label:[],additionalblackmoves:[],additionalwhitemoves:[]};
      // if (/TR(?:\[([a-z][a-z])\])*/.test(info)) {
      //   decorations.triangle=info.match(/TR(?:\[([a-z][a-z])\])*/)[0].match(/[a-z][a-z]/g).map(ConvertCoordsfromString);
      // }
      // if(/SQ(?:\[([a-z][a-z])\])*/.test(info) ){
      //   decorations.square = info.match(/SQ(?:\[([a-z][a-z])\])*/)[0].match(/[a-z][a-z]/g).map(ConvertCoordsfromString);
      // }
      // if(/MA(?:\[([a-z][a-z])\])*/.test(info)){
      //   decorations.cross = info.match(/MA(?:\[([a-z][a-z])\])*/)[0].match(/[a-z][a-z]/g).map(ConvertCoordsfromString);
      // }
      // if(/CR(?:\[([a-z][a-z])\])*/.test(info)){
      //   decorations.circle =info.match(/CR(?:\[([a-z][a-z])\])*/)[0].match(/[a-z][a-z]/g).map(ConvertCoordsfromString);
      // }
      // let comment = movedata[2];
      // if there is no comment, comment will be undefined
      let endstatus;
      // we're going to match for !solved or !failed strings in the comment
      // to determine if the move is at the end of a successful or a failing variation
      if(comment){
        if(comment.match(/!solved/)){
          endstatus = "S";
          comment = comment.replace(/!solved/,"");
        } else if (comment.match(/!failed/)) {
          endstatus = "F";
          comment = comment.replace(/!failed/,"");
        }
      }
      let colour = move.match(/(B|W)/)[1] === "B"? "black" : "white";

      let movenode = move.match(/\[([a-z][a-z])?\]/);
      if (movenode === null){
        // pass
        movenode = {type:"pass",colour:colour,comment:comment};
        gameTree.add(movenode,node,gameTree.traverseBF);
        //this move has been handled so remove it for the next pass
        let newstring = string.replace(movedata[0],"");
        recurse(newstring,movenode);
      } else {
        let movenode = ConvertCoordsfromString(move.match(/\[([a-z][a-z])?\]/)[1]);
        movenode.colour = colour;
        movenode.type = "move";
        movenode.comment = comment;
        movenode.endstatus = endstatus;
        movenode.decorations = decorations;
        movenode.labels = labels;
        gameTree.add(movenode,node,gameTree.traverseBF);
        //this move has been handled so remove it for the next pass
        let newstring = string.replace(movedata[1],"");
        recurse(newstring,movenode);
      };

    }
  }
  recurse(gamemoves,node);
  let gameData = {name:name,gameTree:gameTree,node:node};
  return gameData;
}

// alert("hi;B[ef];W[aa](;B[kj])(;B[qj];W[ss]))(;B[bb](;W[kk];B[lf];W[ij])(;W[rr])))".match(/(\;(B|W).*?)\;/)[1]);
function ConvertCoordsfromString(string){
  let x = string.charCodeAt(0)-97;
  let y = string.charCodeAt(1)-97;
  return {x:x,y:y};
}

export default getTreeFromSGF;
