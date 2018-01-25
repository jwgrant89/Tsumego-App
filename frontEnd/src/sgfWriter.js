
const movedecorations=
  {
    triangle:"TR",
    cross: "MA",
    square: "SQ",
    circle: "CR",
    blackmoves: "AB",
    whitemoves: "AW",
  }

function writeSGF(gameData){
  // expects gameData.name, gameData.node, gameData.gameTree
  let string = "(;GM[1]FF[4]CA[UTF-8]RU[Japanese]SZ[19]KM[0.00]PW[white]PB[black]C[";
  string += gameData.name + "]AW";
  // "Cho Chikun's Life and Death - 1 / 0001]AW[da][ab][bb][cb][db]AB[eb][fb][bc][cc][dc][be])"
  let root = gameData.gameTree.root.data;
  for(let i=0;i<root.priorWhiteMoves.length;i++){
    string+= "[" + coordsToLetters(root.priorWhiteMoves[i]) + "]"
  }
  string += "AB";
  for(let i=0;i<root.priorBlackMoves.length;i++){
    string += "[" + coordsToLetters(root.priorBlackMoves[i]) + "]";
  }
  let index = string.length;
  function recurse(node,index){
    let childrencount = node.children.length;
    if (childrencount===0){
        return;
      }
    if (childrencount===1){
      let childnode = node.children[0];
      let newpart = ";" + pullInfo(childnode);
      string = insert(newpart,string,index);
      let newindex = index+newpart.length;
      recurse(childnode,newindex);
    } else {
      for(let i=0;i<childrencount;i++){
      // need to traverse this list backwards to match the original order
        let childnode = node.children[childrencount-i-1];
        let newpart = "(;" + pullInfo(childnode) +  ")";
        string = insert(newpart,string,index);
        // index should be incremented 1 less than the length, so we land inside the parenthesis
        let newindex = index+ newpart.length-1;
        recurse(childnode,newindex);
      }
    }
  };
  recurse(gameData.gameTree.root,index);
  string += ")";
  return string;
}

function pullInfo(childnode){
  let colour = childnode.data.colour === "black" ? "B" : "W";
  let comment = childnode.data.comment? childnode.data.comment:"";
  let decorations = childnode.data.decorations? childnode.data.decorations:{};
  let labels = childnode.data.labels? childnode.data.labels:[];
  if (childnode.data.endstatus ==="S"){
    comment += " !solved";
  } else if (childnode.data.endstatus==="F") {
    comment+=" !failed";
  }
  let newpart="";
  if(comment === ""){
    newpart = colour + "[" + coordsToLetters(childnode.data) + "]";
  } else{
    newpart = colour + "[" + coordsToLetters(childnode.data) +"]C[" + comment + "]";
 }
 if(Object.keys(decorations).length !== 0){
   for (let i in decorations){
     newpart += movedecorations[i];
     for (let o of decorations[i]){
       newpart += "[" + coordsToLetters(o) + "]";
     }
   }
 }
 if(labels.length!==0){
   newpart += "LB"
   for (let i of labels){
     newpart += "[" + coordsToLetters(i[0]) + ":" + i[1] + "]";
   }
 }
 return newpart;
}

function coordsToLetters(o){
  return String.fromCharCode(o.x+97,o.y+97);
}

function insert(string,inString,atIndex){
  let beginning = inString.slice(0,atIndex);
  let end = inString.slice(atIndex,inString.length);
  return beginning + string + end;
}


export default writeSGF
