// Tree class

class Node {
  constructor(data){
    this.data = data;
    this.parent = null;
    this.children = [];
  }
  static equal(node1,node2){
    if(typeof(node1)==='string' || typeof(node2) ==='string' ){
      return node1===node2
    }
    return node1.data.x === node2.data.x && node1.data.y === node2.data.y;
  }
  depth(){
    let count = 0;
    function recurse(node){
      if (node.parent === null){
        return;
      }
      count+=1;
      recurse(node.parent);
    }
    recurse(this);
    return count;
  }
}

class Tree {
  constructor(data){
    var node = new Node(data);
    this.root = node;
  }
  traverseDF(callback) {

    // this is a recurse and immediately-invoking function
    (function recurse(currentNode) {
        // step 2
        for (var i = 0, length = currentNode.children.length; i < length; i++) {
            // step 3
            recurse(currentNode.children[i]);
        }

        // step 4
        callback(currentNode);

        // step 1
    })(this.root);

  };
  traverseBF(callback) {
      var queue = new Queue();

      queue.enqueue(this.root);

      let currentTree = queue.dequeue();

      while(currentTree){
          for (var i = 0, length = currentTree.children.length; i < length; i++) {
              queue.enqueue(currentTree.children[i]);
          }

          callback(currentTree);
          currentTree = queue.dequeue();
      }
  };
  contains(callback, traversal) {
      traversal.call(this, callback)
  }
  // nodewithdata(data){
  //   this.contains(function(checknode){
  //     if (data === checknote.data){
  //       return checknode;
  //     }
  //   },traverseDF);
  // }
  has(data){
    let found = null;
    this.contains(function(checknode){
      if (checknode.data === data){
        found = checknode;
      }
    },this.traverseDF);
    return found;
  }
  subtree(data){
    //create a new tree with the node as the root
    let node = this.has(data);
    let subtree = new Tree(node.data);
    subtree.root.children = node.children;
    return subtree;
  }
  isSimple(){
    let check=true;
    this.contains(function(checknode){
      if(checknode.children.length>1){
        check = false;
      }
    },this.traverseBF);
    return check;
  }
  simplesubtrees(){
    // finds the maximal simple subtrees
    // outputs them as nodes of the tree, so we can still access parents
    let list = [];
    let self = this;
    this.contains(function(checknode){
      let subtree = self.subtree(checknode.data);
      // produce a subtree rooted at the checknode
      if(subtree.isSimple()){
        //if it's simple
        if(checknode.parent){
          // check that the parent is not null so we can define the parent tree
          let parenttree = self.subtree(checknode.parent.data);
          if(!parenttree.isSimple()){
            //if parent tree is not simple, we have found a maximal simple, so add it
            list.push(checknode);
          }
        } else {
          //for the root node, it is unique maximal simple so add it
            list.push(checknode);
        }
          }
    },this.traverseBF);
    return list;
  }
  static isSubtree(treeA,treeB){
    // is treeB a subtree of treeA?
    let check = false;
    treeA.contains(function(checknode){
      if(checknode.children === treeB.root.children){
        check = true;
      }
    },treeA.traverseDF);
    return check;
  }
  cloneTree(){
    // return new tree instance with new node instances but same data
    let newtree = new Tree(this.root.data);
    let self = this;
    this.contains(function(node){
      if(node.data !== self.root.data){
        newtree.add(node.data, node.parent.data, newtree.traverseBF);
      }
    },this.traverseBF);
    return newtree;
  }
  move(data,toIndex){
    // reorders the children of the data's parent
    let newtree=this.cloneTree();
    let node = newtree.has(data);
    let parent = node.parent;
    let currentindex = findIndex(parent.children,data);
    parent.children.splice(toIndex,0,parent.children.splice(currentindex,1)[0]);
    return newtree;
  }

  parentsandchildren(data){
    let newtree = this.cloneTree();
    let node = newtree.has(data);
    if (node === null){
      throw new Error ("data not found");
    }
    let nodelist = []

    newtree.contains(function(nodes){
      if(newtree.subtree(nodes.data).has(data)===null && newtree.subtree(data).has(nodes.data)===null){
        nodelist.push(nodes)
      }
    },newtree.traverseDF);

    for (let i=0;i<nodelist.length;i++){
      if (newtree.has(nodelist[i].data)){
        newtree.remove(nodelist[i].data,nodelist[i].parent.data,newtree.traverseBF);
      };
    };
    return newtree;
  }
  parents (data){
    // returns a tree with only parents of given node plus node itself
    let newtree = this.cloneTree();
    let node = newtree.has(data);
    if (node === null){
      throw new Error ("data not found");
    }
    let nodelist = []

    newtree.contains(function(nodes){
      if(newtree.subtree(nodes.data).has(data)===null){
        nodelist.push(nodes)
      }
    },newtree.traverseDF)

    for (let i=0;i<nodelist.length;i++){
      if (newtree.has(nodelist[i].data)){
        newtree.remove(nodelist[i].data,nodelist[i].parent.data,newtree.traverseBF);
      };
    };
    return newtree;
  }
  add(data, toData, traversal) {
    var child = new Node(data),
        parent = null,
        callback = function(node) {
            if (node.data === toData) {
                parent = node;
            }
        };

    this.contains(callback, traversal);

    if (parent) {
        parent.children.push(child);
        child.parent = parent;
    } else {
        throw new Error('Cannot add node to a non-existent parent.');
    }
  };
  remove(data, fromData, traversal) {
    var tree = this,
        parent = null,
        childToRemove = null,
        index;

    var callback = function(node) {
        if (node.data === fromData) {
            parent = node;
        }
    };

    tree.contains(callback, traversal);

    if (parent) {
        index = findIndex(parent.children, data);

        if (index === undefined) {
            throw new Error('Node to remove does not exist.');
        } else {
            childToRemove = parent.children.splice(index, 1);
        }
    } else {
        throw new Error('Parent does not exist.');
    }

    return childToRemove;
  };
}


function findIndex(arr, data) {
    var index;

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].data === data) {
            index = i;
        }
    }

    return index;
}

class Queue {
  constructor (){
    this._oldestIndex = 1;
    this._newestIndex = 1;
    this._storage = {};
  }
  size() {
    return this._newestIndex - this._oldestIndex;
  };
  enqueue(data) {
    this._storage[this._newestIndex] = data;
    this._newestIndex++;
  };
  dequeue(){
    var oldestIndex = this._oldestIndex,
        deletedData = this._storage[oldestIndex];

    delete this._storage[oldestIndex];
    this._oldestIndex++;

    return deletedData;
  };
}

export default Tree;
