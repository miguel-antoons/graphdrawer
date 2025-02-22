let canvas;
let ctx;
let pliesPerDirection;

window.addEventListener("load", function () {
  canvas = document.getElementById("graphCanvas");
  ctx = canvas.getContext("2d");
  pliesPerDirection = document.getElementById("pliesPerDirection");
  resizeFn();

  // move the node while dragging
  canvas.addEventListener("mousemove", (event) => {
    if (draggingNode) {
      oldX = draggingNode.x;
      oldY = draggingNode.y;
      const rect = canvas.getBoundingClientRect();
      draggingNode.x = event.clientX - rect.left - offsetX;
      draggingNode.y = event.clientY - rect.top - offsetY;
      // update the canvas
      drawGraph();
      absDiffX = Math.abs(oldX - draggingNode.x);
      absDiffY = Math.abs(oldY - draggingNode.y);
      totalDiff = absDiffX + absDiffY;

      // if the node was dragged more than 5 pixels, set the flag to true
      // 5 pixels is the threshold to consider that the node was dragged
      if (totalDiff > 5) {
        recentlyDragged = true;
      }
    }
  });

  canvas.addEventListener("mouseup", () => {
    draggingNode = null;
  });

  // create a new node or edge when clicking on the canvas
  canvas.addEventListener("click", (event) => {
    // if the node was recently dragged, do not create a new node
    if (recentlyDragged || deleteMode) {
      recentlyDragged = false;
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let clickedNode = getNodeAt(x, y);
    if (clickedNode) {
      if (
        selectedNode &&
        selectedNode !== clickedNode &&
        !selectedNode.edges.has(clickedNode)
      ) {
        // create a new edge between the selected node and the clicked node
        edges.push(new Edge(selectedNode, clickedNode));
        selectedNode.edges.add(clickedNode);
        clickedNode.edges.add(selectedNode);
        selectedNode.selected = false;
        selectedNode = null;
        drawGraph();
      } else if (selectedNode && selectedNode === clickedNode) {
        // if the clicked node is the same as the selected node, deselect it
        selectedNode = null;
        clickedNode.selected = false;
        clickedNode.draw();
      } else if (clickedNode.isNew) {
        // if the clicked node is new, do nothing (prevents a new node to be selected at creation)
        clickedNode.isNew = false;
      } else if (!(selectedNode && selectedNode !== clickedNode)) {
        selectedNode = clickedNode;
        selectedNode.selected = true;
        drawGraph();
      }
    }
  });

  // create a new node when clicking on the canvas or delete a node when clicking on it
  canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let clickedNode = getNodeAt(x, y);
    if (!deleteMode) {
      if (clickedNode) {
        draggingNode = clickedNode;
        offsetX = x - clickedNode.x;
        offsetY = y - clickedNode.y;
      } else {
        // create new node
        let newNode = new Node(x, y);
        nodes.push(newNode);
        drawGraph();
      }
    } else {
      if (clickedNode) {
        // delete node and its edtes
        nodes = nodes.filter((node) => node !== clickedNode);
        edges = edges.filter(
          (edge) => edge.nodeA !== clickedNode && edge.nodeB !== clickedNode,
        );
        drawGraph();
      }

      let clickedEdge = edges.find((edge) => edge.isBetween(x, y));
      if (clickedEdge) {
        // delete edge
        edges = edges.filter((edge) => edge !== clickedEdge);
        clickedEdge.nodeA.edges.delete(clickedEdge.nodeB);
        clickedEdge.nodeB.edges.delete(clickedEdge.nodeA);
        drawGraph();
      }
    }
  });
});

let nodes = [];
let edges = [];
let nodeIdCounter = 1; // counter for the nodes used for assigning an id to each node
let selectedNode = null; // the node that is currently selected
let draggingNode = null; // the node that is currently being dragged
let offsetX, offsetY; // the offset between the mouse and the node
let recentlyDragged = false; // flag to check if a node was recently dragged
let deleteMode = false; // flag to check if the delete mode is enabled

class Node {
  constructor(x, y) {
    this.id = nodeIdCounter++;
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.thickness = 0;
    this.no0 = 0;
    this.no45 = 0;
    this.no90 = 0;
    this.edges = new Set();
    this.selected = false;
    this.assignedIndex = -1;
  }

  draw(color = "white") {
    if (this.selected) {
      color = "lightblue";
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.id, this.x, this.y - 15);
    ctx.font = "bold 15px Arial";
    ctx.fillText(this.thickness, this.x, this.y + 10);
  }

  addInputs() {
    pliesPerDirection.innerHTML += `
      <div id=ss${this.id} class="ss">
        <span class='nodeId'>Node ${this.id}</span>
        <input class="first" type="number" min="0" max="9999" step="1" name="thickness" value="${this.thickness}" oninput="Node.changeThickness(this, ${this.id});">
        <input class="middle" type="number" min="0" max="9999" step="1" name="no0" value="${this.no0}" oninput="Node.changeNo0(this, ${this.id});">
        <input class="middle" type="number" min="0" max="9999" step="1" name="no45" value="${this.no45}" oninput="Node.changeNo45(this, ${this.id});">
        <input class="last" type="number" min="0" max="9999" step="1" name="no90" value="${this.no90}" oninput="Node.changeNo90(this, ${this.id});">
      </div>
    `;
  }

  static changeNo0(input, nodeId) {
    let node = nodes.find((node) => node.id === nodeId);
    node.no0 = Number(input.value);
  }

  static changeNo45(input, nodeId) {
    let node = nodes.find((node) => node.id === nodeId);
    node.no45 = Number(input.value);
  }

  static changeNo90(input, nodeId) {
    let node = nodes.find((node) => node.id === nodeId);
    node.no90 = Number(input.value);
  }

  static changeThickness(input, nodeId) {
    let node = nodes.find((node) => node.id === nodeId);
    node.thickness = Number(input.value);
    node.draw();
  }
}

class Edge {
  constructor(nodeA, nodeB) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.nodeA.x, this.nodeA.y);
    ctx.lineTo(this.nodeB.x, this.nodeB.y);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  isBetween(x, y) {
    // check if the point (x, y) is close to the line between the two nodes
    const x1 = this.nodeA.x;
    const y1 = this.nodeA.y;
    const x2 = this.nodeB.x;
    const y2 = this.nodeB.y;
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    const dot = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    return Math.abs(y - (m * x + b)) < 3 && dot >= 0 && dot <= len * len;
  }
}

// function updates the whole page
function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pliesPerDirection.innerHTML = `
      <div class='ss'>
        <span class='nodeId'>Node #</span>
        <span class='title'>Thickness</span>
        <span class='title'>0°</span>
        <span class='title'>+/- 45°</span>
        <span class='title'>90°</span>
      </div>
    `;
  edges.forEach((edge) => edge.draw());
  nodes.forEach((node) => node.draw());
  nodes.forEach((node) => node.addInputs());
}

function getNodeAt(x, y) {
  return nodes.find(
    (node) => Math.hypot(node.x - x, node.y - y) < node.radius + 1,
  );
}

// generate a file from the graph
function generateFile() {
  // sort nodes by thickness, largest to smallest
  nodes.sort((a, b) => b.thickness - a.thickness);
  for (let node in nodes) nodes[node].assignedIndex = node;
  if (!verifyIntegrity()) {
    return;
  }

  let fileContent = "";
  fileContent += getThicknesses();
  fileContent += getRoots();
  fileContent += getEdges();
  fileContent += getPliesPerDirection();

  // crete a blob with the file content
  let file = new Blob([fileContent], { type: "text/plain" });
  let a = document.createElement("a");
  let url = URL.createObjectURL(file);
  a.href = url;
  a.download = "instance.csi";
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

function verifyIntegrity() {
  for (let node of nodes) {
    if (node.thickness === 0) {
      document.getElementById("error").innerHTML = `
        <div class="alert alert-danger" role="alert">
          Node ${node.id} has a thickness of 0. Please enter a valid thickness.
        </div>`;
      return false;
    }

    let sumPlyPerDirection = node.no0 + node.no45 + node.no90;
    if (sumPlyPerDirection > node.thickness) {
      document.getElementById("error").innerHTML = `
        <div class="alert alert-danger" role="alert">
          The sum of the minimum number of plies per direction for node ${node.id} is
          greater than the thickness (${node.thickness} < ${node.no0} + ${node.no45} + ${node.no90}).
          Please enter a valid number of plies per direction.
        </div>`;
      return false;
    }
  }
  document.getElementById("error").innerHTML = "";
  return true;
}

function getThicknesses() {
  let fileContent = "";
  for (let node of nodes) {
    fileContent += `${node.thickness} `;
  }
  fileContent += "\n";
  return fileContent;
}

function getRoots() {
  let fileContent = "";
  for (let node of nodes) {
    if (node.no0 + node.no45 + node.no90 > 0) {
      fileContent += `${node.assignedIndex} `;
    }
  }
  fileContent += "\n";
  return fileContent;
}

function getEdges() {
  let fileContent = "";
  for (let edge of edges) {
    let nodeA =
      edge.nodeA.thickness > edge.nodeB.thickness ? edge.nodeA : edge.nodeB;
    let nodeB =
      edge.nodeA.thickness > edge.nodeB.thickness ? edge.nodeB : edge.nodeA;
    fileContent += `${nodeA.assignedIndex} ${nodeB.assignedIndex}\n`;
  }
  fileContent += "\n";
  return fileContent;
}

function getPliesPerDirection() {
  let fileContent = "";
  for (let node of nodes) {
    if (node.no0 + node.no45 + node.no90 > 0) {
      fileContent += `${node.no0} ${Math.floor(node.no45 / 2)} ${node.no90} ${Math.ceil(node.no45 / 2)}\n`;
    }
  }
  fileContent += "\n";
  return fileContent;
}

function resizeFn() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight / 1.5;
  drawGraph();
}

window.onresize = resizeFn;
