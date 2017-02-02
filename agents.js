var SimGlobal = {
  PAUSED: false,
  TICKS: 0,
  UPDATE_RATE: 15,
  UPDATE_HANDLE: null,
  AGENT_CTX: null,
  SCREEN_WIDTH: -1,
  SCREEN_HEIGHT: -1,
  
  AGENT_COUNT: 0,
  POPULATION_DENSITY: 0.0011,
  AGENT_ID_COUNTER: 0,

  DRAW_AGENTS: true,
  DRAW_SENSORS: false,
  AGENT_SIZE: 2.0,
  DRAW_STATS: true,
  
  //stats
  fps: 0, 
  now: 0,
  lastUpdate: (new Date)*1,
  fpsFilter: 15,
  
  agents: new Array()

}

function Vector(){

  // The JS Modulo Bug
  Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
  };

	/** Data.  Apologies for one-letter variable name. */
	this.d = new Array(2);
	
	/** Nubmer of dimensions.  These boids are only 2D. */
	this.dimensions = 2;
	
	this.d[0] = 0;
	this.d[1] = 0;
}

function Agent() {
  this.id = SimGlobal.AGENT_ID_COUNTER++;
  this.color = "rgba(0,0,0,1)"; //gets updated in updatePosition()
  this.hue = 121
  
  this.position = new Vector();
  this.velocity = new Vector();
  this.angle = (Math.random()*360)-180;

	this.position.d[0] = Math.random() * SimGlobal.SCREEN_WIDTH;
	this.position.d[1] = Math.random() * SimGlobal.SCREEN_HEIGHT;
	
	this.sensor_length = 50;
	this.sensor_a_angle = -90;	
	this.sensor_b_angle = 90;
  this.sensor_aperture = 175;
	
  this.update = function() {
    //update position.
    this.updatePosition();
    
    var sensor_left_agents = this.agentsInCone(this.sensor_a_angle, this.sensor_aperture, this.sensor_length, true);
    var sensor_right_agents = this.agentsInCone(this.sensor_b_angle, this.sensor_aperture, this.sensor_length, true);

    var speed = Math.sqrt(Math.pow(this.velocity.d[0],2),Math.pow(this.velocity.d[1],2));

    //PPS CODE:

    var alpha = 180
    var beta = 17
    var v = 3.50

    var L = sensor_left_agents.length
    var R = sensor_right_agents.length
    var N = L + R

    var delta_phi = alpha + beta * N * Math.sign(R - L)

    this.go(v)
    this.turn(delta_phi)

    if (N < 35 && N > 15) this.hue = 227
    else if (N > 35) this.hue = 58
    else if (N < 15) this.hue = 121
      else this.hue = 310
  }
  
  this.die = function () {
    var index = SimGlobal.agents.indexOf(this);

    if (index > -1) {
        SimGlobal.agents.splice(index, 1);
    }
  }
  
  
  this.agentsInCircle = function (length,draw) {
    return this.agentsInCone(-180,360,length,draw);
  }
  
  this.agentsInCone = function (angle, aperture, length, draw) {
    var point_center = new Vector();
    var point_left = new Vector();
    var point_right = new Vector();
    
    angle_rad = (-45 * (Math.PI/180)) + (this.angle  * (Math.PI/180)) +(angle * (Math.PI/180));
    aperture_rad = (aperture * (Math.PI/180));
    
    point_center.d[0] = this.position.d[0];
    point_center.d[1] = this.position.d[1];
    
    point_left.d[0]   = this.position.d[0] + (length * Math.cos(angle_rad));
    point_left.d[1]   = this.position.d[1] + (length * Math.sin(angle_rad));
    
    point_right.d[0]  = this.position.d[0] + (length * Math.cos(angle_rad+aperture_rad));
    point_right.d[1]  = this.position.d[1] + (length * Math.sin(angle_rad+aperture_rad));
    
    if (draw && SimGlobal.DRAW_SENSORS) {
      SimGlobal.AGENT_CTX.fillStyle = 'rgba(255,255,255,0.2)';
      
      SimGlobal.AGENT_CTX.beginPath();
      SimGlobal.AGENT_CTX.moveTo(point_center.d[0], point_center.d[1]);
      SimGlobal.AGENT_CTX.lineTo(point_left.d[0], point_left.d[1]);
      
      SimGlobal.AGENT_CTX.arc(point_center.d[0],point_center.d[1],length,angle_rad,angle_rad+aperture_rad);
      
      SimGlobal.AGENT_CTX.moveTo(point_center.d[0], point_center.d[1]);
      SimGlobal.AGENT_CTX.lineTo(point_right.d[0], point_right.d[1]);

      SimGlobal.AGENT_CTX.fill();
    }
    
    var hit_agents = new Array()
    
    for (var i = 0; i < SimGlobal.agents.length; i++){
      //if it's me, stop.
      if (SimGlobal.agents[i] == this) continue;
      
      //get position of other agent
      var x1 = this.position.d[0]
      var y1 = this.position.d[1]
      var x2 = SimGlobal.agents[i].position.d[0];
      var y2 = SimGlobal.agents[i].position.d[1];

      var xmax = SimGlobal.SCREEN_WIDTH
      var ymax = SimGlobal.SCREEN_HEIGHT

      //calculate angle to point
      var dx = x2-x1;
      var dy = y2-y1;

      //fix for wraparound space
      while (dx < -xmax / 2)
        dx += xmax
      while (dy < -ymax / 2)
        dy += ymax
      while (dx > xmax / 2)
        dx -= xmax
      while (dy > ymax / 2)
        dy -= ymax

      //calculate distance and refuse if outside length
      var distance = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
      if (distance>length) continue;
      
      var agent_angle_rad = Math.atan2(dy,dx);
      if (agent_angle_rad>(angle_rad+aperture_rad) || agent_angle_rad<angle_rad) continue;
      
      hit_agents.push(SimGlobal.agents[i])
    }
    
    return hit_agents;
  }
  
  this.updatePosition = function () {
    this.position.d[0]+=this.velocity.d[0];
    this.position.d[1]+=this.velocity.d[1];

    this.position.d[0] = this.position.d[0].mod(SimGlobal.SCREEN_WIDTH);
    this.position.d[1] = this.position.d[1].mod(SimGlobal.SCREEN_HEIGHT);

    //update color
    var hue = Math.floor(Math.abs(this.hue));
    this.color = "hsl("+hue+",100%, 50%)";
  }
  
  this.go = function (speed) {
    var angle_rad = this.angle * (Math.PI/180);
    this.velocity.d[0] = speed * Math.cos(angle_rad)
    this.velocity.d[1] = speed * Math.sin(angle_rad)
  }
  
  this.turn = function (angle) {
    this.angle += angle

    var newAngle = this.angle;
    
    while (newAngle <= -180) newAngle += 360;
    while (newAngle > 180) newAngle -= 360;

    this.angle = newAngle

  }
}

function initSimulation() {
  console.log("initSimulation() called.")
  
  var div=document.getElementsByTagName('div')[0];
  
  var agent_canvas=document.getElementById('agents'); 
  SimGlobal.AGENT_CTX=agent_canvas.getContext('2d');

  agent_canvas.width=div.scrollWidth
  agent_canvas.height=div.scrollHeight

  SimGlobal.SCREEN_WIDTH = div.scrollWidth;
  SimGlobal.SCREEN_HEIGHT = div.scrollHeight;  
  
  SimGlobal.AGENT_COUNT = SimGlobal.SCREEN_WIDTH * SimGlobal.SCREEN_HEIGHT * SimGlobal.POPULATION_DENSITY
  
  for (var i=0; i < SimGlobal.AGENT_COUNT; i++){
    SimGlobal.agents[i] = new Agent();
  }

  SimGlobal.UPDATE_HANDLE = setInterval(update, SimGlobal.UPDATE_RATE);
  
  window.onresize = function(event) {
    var div=document.getElementsByTagName('div')[0];
    agent_canvas.width=div.scrollWidth;
    agent_canvas.height=div.scrollHeight;
    SimGlobal.SCREEN_WIDTH = div.scrollWidth;
    SimGlobal.SCREEN_HEIGHT = div.scrollHeight;
    SimGlobal.AGENT_COUNT = SimGlobal.SCREEN_WIDTH * SimGlobal.SCREEN_HEIGHT * SimGlobal.POPULATION_DENSITY
    resetButton()
  };
}

function draw() {
  for (var i = 0; i < SimGlobal.agents.length; i++){
    var x = SimGlobal.agents[i].position.d[0];
    var y = SimGlobal.agents[i].position.d[1];
    SimGlobal.AGENT_CTX.fillStyle = SimGlobal.agents[i].color;
    var size = 2+(SimGlobal.AGENT_SIZE);
    //SimGlobal.AGENT_CTX.fillRect((x-size/2),(y-size/2),size,size);
    SimGlobal.AGENT_CTX.beginPath();
    SimGlobal.AGENT_CTX.arc(x,y, size, 0, 2 * Math.PI, false);
    SimGlobal.AGENT_CTX.fill();
  }
  
  var thisFrameFPS = 1000 / ((SimGlobal.now=new Date) - SimGlobal.lastUpdate);
  if (SimGlobal.now!=SimGlobal.lastUpdate){
      SimGlobal.fps += (thisFrameFPS - SimGlobal.fps) / SimGlobal.fpsFilter;
      SimGlobal.lastUpdate = SimGlobal.now;
  }

}

function updateAgents() {
  for (var i = 0; i < SimGlobal.agents.length; i++){
    SimGlobal.agents[i].update();
  }
  
  //respawn
  while (SimGlobal.agents.length < SimGlobal.AGENT_COUNT) {
    var child = new Agent();
    SimGlobal.agents.push(child);
  }
}

/*** STATS **///

function drawTextStats() {
  var x=0,y=0,width=190,height=65;
  var background_color = "rgba(60,60,60,1)";
  var text_color = "rgba(255,255,255,1)";
  
  //draw background
  //SimGlobal.AGENT_CTX.fillStyle = background_color;
  //SimGlobal.AGENT_CTX.fillRect(x,y,width,height);
  
  //assemble array
  var text_array = new Array();
  
  text_array.push("ticks: " + SimGlobal.TICKS);
  text_array.push("FPS:     " + SimGlobal.fps.toFixed(2));
  text_array.push("FPS aim: " + (950/SimGlobal.UPDATE_RATE).toFixed(2));
  text_array.push("agent count: " + SimGlobal.agents.length)
    
  //draw the text
  SimGlobal.AGENT_CTX.fillStyle = text_color;
  SimGlobal.AGENT_CTX.font="13px monospace";
  
  for (var i=0; i<text_array.length; i++) {
    SimGlobal.AGENT_CTX.fillText(text_array[i],x+10,y+20+(i*15));
  }
}

function drawHistogram(data, flipped) {
  var x=1,y=0,width=SimGlobal.SCREEN_WIDTH-1,height=100;
  y = SimGlobal.SCREEN_HEIGHT-height;
  var background_color = "rgba(60,60,60,0.7)";
  var foreground_color = "rgba(255,255,255,0.0)";
  
  //draw background
  SimGlobal.AGENT_CTX.fillStyle = background_color;
  //SimGlobal.AGENT_CTX.fillRect(x,y,width,height);
  
  SimGlobal.AGENT_CTX.lineWidth="1";
  SimGlobal.AGENT_CTX.strokeStyle=foreground_color;
    
  //var range=data.slice(0).sort().reverse()[0],bins=data.length;
  var range=5,bins=data.length;
  
  for (var i=0; i<bins; i++) {
    var value = data[i];

    var bin_width = width/bins;
    var bin_height = (value / range) * height;
    var bin_x = i * bin_width;
    var bin_y = y;
    
    if (flipped) {
      bin_height = -bin_height;
      bin_y += height;
    }
    
    SimGlobal.AGENT_CTX.beginPath();
    SimGlobal.AGENT_CTX.rect(bin_x,bin_y,bin_width,bin_height);
    SimGlobal.AGENT_CTX.stroke();
    
    SimGlobal.AGENT_CTX.fillRect(bin_x,bin_y,bin_width,bin_height);
    
  }
  
}

function drawStats() {
  drawTextStats();
  
  var bins = SimGlobal.SCREEN_WIDTH/8;
  var data = new Array();
  
  for (var i=0; i < bins; i++){
    data.push(0.0);
  }
  
  /*var highest_energy = SimGlobal.agents.sort(function(a, b) {
      var x = a.energy; var y = b.energy;
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  }).reverse()[0].energy;*/
  
  var highest_energy = SimGlobal.MAX_ENERGY;

  for (var i=0; i < SimGlobal.agents.length; i++){
    var bin = Math.floor(SimGlobal.agents[i].energy / highest_energy * bins);
    data[bin-1]++;
    
  }
  
  drawHistogram(data, true);
}

function update(){
  //console.log(SimGlobal.agents.length)
  if (!SimGlobal.PAUSED) {
    SimGlobal.AGENT_CTX.clearRect(0,0,SimGlobal.SCREEN_WIDTH, SimGlobal.SCREEN_HEIGHT);
    if (SimGlobal.DRAW_STATS) drawStats();
	  updateAgents();
	  if (SimGlobal.DRAW_AGENTS) draw();
	  SimGlobal.TICKS++;
  }
}

function fasterButton() {
  SimGlobal.UPDATE_RATE = Math.max(SimGlobal.UPDATE_RATE-1, 1)
  clearInterval(SimGlobal.UPDATE_HANDLE)
  SimGlobal.UPDATE_HANDLE = setInterval(update, SimGlobal.UPDATE_RATE);
  
  if (SimGlobal.UPDATE_RATE == 1) {
     $("#faster").text("fastest!");
  } else {
    $("#faster").text("faster");
  }
  
  if (SimGlobal.UPDATE_RATE == 60) {
     $("#slower").text("slowest!");
  } else {
    $("#slower").text("slower");
  }
}

function slowerButton() {
  SimGlobal.UPDATE_RATE = Math.min(SimGlobal.UPDATE_RATE+1, 30)
  clearInterval(SimGlobal.UPDATE_HANDLE)
  SimGlobal.UPDATE_HANDLE = setInterval(update, SimGlobal.UPDATE_RATE);
  
  if (SimGlobal.UPDATE_RATE == 30) {
     $("#slower").text("slowest!");
  } else {
    $("#slower").text("slower");
  }
  
  if (SimGlobal.UPDATE_RATE == 5) {
     $("#faster").text("fastest!");
  } else {
    $("#faster").text("faster");
  }
}

function resetButton() {

  for (var i=0; i < SimGlobal.agents.length; i++){
    SimGlobal.agents[i].die();
  }
  
  for (var i=0; i < SimGlobal.AGENT_COUNT; i++){
    SimGlobal.agents[i] = new Agent();
  }
  
  SimGlobal.PAUSED = false;
}

function pauseButton() {
  SimGlobal.PAUSED = !SimGlobal.PAUSED;
  if (SimGlobal.PAUSED) {
    $("#pause").text("play");
  } else {
    $("#pause").text("pause");
    
  }
}
