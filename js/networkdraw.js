$(function() {
  Kinetic.MyCircle = function(config) {
    this._initMyCircle(config);
  };

  Kinetic.MyCircle.prototype = {
    _initMyCircle: function(config) {
      Kinetic.Circle.call(this, config);
    },
    parent_object : {}
  };

  Kinetic.Util.extend(Kinetic.MyCircle, Kinetic.Circle);

  Kinetic.MyImage = function(config) {
    this._initMyImage(config);
  };

  Kinetic.MyImage.prototype = {
    _initMyImage: function(config) {
      Kinetic.Image.call(this, config);
    },
    parent_object : {}
  };

  Kinetic.Util.extend(Kinetic.MyImage, Kinetic.Image);

  var NetworkDrawer = NetworkDrawer || {};
  NetworkDrawer.util = (function() {
  })();

  NetworkDrawer.objects =(function() {
    var Joints = [];
    var init = function() {
      load_svgs();
    };

    var get_img_obj = function(svgs, name) {
      for(var i = 0; i < svgs.length; i++) {
        if(svgs[i].name === name) {
          return svgs[i].img;
        }
      }
    };

    var kinetic_image = function(svgs, x, y, name, width, height) {
      var k_image = new Kinetic.MyImage({
        image: get_img_obj(svgs, name),
        x: x,
        y: y,
        width: width,
        height: width,
        draggable: true,
        name: 'image'
      });
      return k_image;
    };

    var Interface = function(x, y, server, offset_x, offset_y, count) {
      _self = this;
      this.type = "Interface";
      this.x = x;
      this.y = y;
      this.interface_type = 'eth';
      this.name = _self.interface_type + count;
      this.ip_addresses = [];
      this.offset_x = offset_x;
      this.offset_y = offset_y;
      this.server = server;
      this.joints = [];
      this.kinetic = new Kinetic.MyCircle({
        x: x,
        y: y,
        radius: 5,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2,
        draggable: true
      });
    };

    var Joint = function(coords) {
      _self = this;
      this.p1 = {x: coords[0], y: coords[1]};
      this.p2 = {x: coords[2], y: coords[3]};
      this.update_line = function(p1, p2) {
        _self.kinetic.setPoints([p1.x, p1.y, p2.x, p2.y]);
        Layer1.draw();
      };
      this.kinetic = new Kinetic.Line({
        points: coords,
        stroke: 'black',
        strokeWidth: 2,
      });
    };

    var Cloud = function(svgs, x, y) {
      var _self = this;
      this.base = Server;
      this.base(svgs, x, y);
      this.type = "Cloud";
      this.kinetic = kinetic_image(svgs, x, y, this.type, 72, 75);
      this.kinetic.on('dragmove', nodeMoveHandler);
    };

    var CiscoSwitch = function(svgs, x, y) {
      var _self = this;
      this.base = Server;
      this.base(svgs, x, y);
      this.type = "CiscoSwitch";
      this.kinetic = kinetic_image(svgs, x, y, this.type, 68, 29);
      this.kinetic.on('dragmove', nodeMoveHandler);
    };

    var Router = function(svgs, x, y) {
      var _self = this;
      this.base = Server;
      this.base(svgs, x, y);
      this.type = "Router";
      this.kinetic = kinetic_image(svgs, x, y, this.type, 72, 75);
      this.kinetic.on('dragmove', nodeMoveHandler);
    };

    var Desktop = function(svgs, x, y) {
      var _self = this;
      this.base = Server;
      this.base(svgs, x, y);
      this.type = "Desktop";
      this.kinetic = kinetic_image(svgs, x, y, this.type, 72, 75);
      this.kinetic.on('dragmove', nodeMoveHandler);
    };

    var Server = function(svgs, x, y) {
      var _self = this;
      this.type = "Server";
      this.x = x;
      this.y = x;
      this.get_interface_add_offset = function() {
        var leng = _self.interfaces.length;
        switch(leng) {
          case 0:
            return {x: 0, y: 80};
          case 1:
            return {x: 20, y: 80};
          case 2:
            return {x: 40, y: 80};
          case 3:
            return {x: 60, y: 80};
          case 4:
            return {x: 0, y: -5};
          case 5:
            return {x: 20, y: -5};
          case 6:
            return {x: 40, y: -5};
          case 7:
            return {x: 60, y: -5};
        }
      };
      this.interfaces =[];
      this.kinetic = kinetic_image(svgs, x, y, this.type, 72, 75);
      this.addinterface = function() {
        var iface = new Interface(
          _self.kinetic.getPosition().x + _self.get_interface_add_offset().x,
          _self.kinetic.getPosition().y + _self.get_interface_add_offset().y,
          _self,
          _self.get_interface_add_offset().x,
          _self.get_interface_add_offset().y,
          _self.interfaces.length
        );
        iface.kinetic.parent_object = iface;
        var old_position;
        iface.kinetic.on('dragstart', function() {
          iface.server.kinetic.setStroke('Red');
          old_position = iface.kinetic.getPosition();
        });
        iface.kinetic.on('dragend', function(e) {
          iface.server.kinetic.setStroke('');
          iface.server.kinetic.setStrokeWidth(0);
          Layer1.draw();
          if(colliding(iface.server, iface)) {
            iface.kinetic.setPosition(old_position);
            interfaceJointsHandler(e);
            Layer1.draw();
          } else {
            iface.offset_x =
              iface.kinetic.getPosition().x - _self.kinetic.getPosition().x;
            iface.offset_y =
              iface.kinetic.getPosition().y - _self.kinetic.getPosition().y;
          }
        });
        iface.kinetic.on('dragmove', interfaceJointsHandler);
        Layer1.add(iface.kinetic);
        Layer1.draw();
        this.interfaces.push(iface);
      };
      this.kinetic.on('dragmove', nodeMoveHandler);
    };

    var colliding_shape = function(rec1, rec2) {
      var status = false;
      var rec1Top = rec1.getPosition().y;
      var rec1Bottom = rec1.getPosition().y + rec1.height();
      var rec1Left = rec1.getPosition().x;
      var rec1Right = rec1.getPosition().x + rec1.width();

      var rec2Top = rec2.getPosition().y;
      var rec2Bottom = rec2.getPosition().y + rec2.height();
      var rec2Left = rec2.getPosition().x;
      var rec2Right = rec2.getPosition().x + rec2.width();

      if(!(rec1Bottom < rec2Top || rec1Top > rec2Bottom || rec1Left > rec2Right ||
        rec1Right < rec2Left)) {
        status = true;
      }
      return status;
    };

    var colliding = function(rec1, rec2) {
      var status = false;
      var rec1Top = rec1.kinetic.getPosition().y;
      var rec1Bottom = rec1.kinetic.getPosition().y + rec1.kinetic.height();
      var rec1Left = rec1.kinetic.getPosition().x;
      var rec1Right = rec1.kinetic.getPosition().x + rec1.kinetic.width();

      var rec2Top = rec2.kinetic.getPosition().y;
      var rec2Bottom = rec2.kinetic.getPosition().y + rec2.kinetic.height();
      var rec2Left = rec2.kinetic.getPosition().x;
      var rec2Right = rec2.kinetic.getPosition().x + rec2.kinetic.width();

      if(!(rec1Bottom < rec2Top || rec1Top > rec2Bottom || rec1Left > rec2Right ||
        rec1Right < rec2Left)) {
        status = true;
      }
      return status;
    };

    function nodeMoveHandler(e) {
      var _self = e.targetNode.parent_object;
      _self.interfaces.forEach(function(iface) {
        iface.kinetic.setPosition({
          x: _self.kinetic.getPosition().x + iface.offset_x,
          y: _self.kinetic.getPosition().y + iface.offset_y
        });
        interfaceJointsHandler(undefined, iface);
      });
    }

    function interfaceJointsHandler(e, iface) {
      var iface = iface || e.targetNode.parent_object; //jshint ignore: line
      var iface_x = iface.kinetic.getPosition().x;
      var iface_y = iface.kinetic.getPosition().y;
      iface.joints.forEach(function(joint) {
        if(joint.point === "p1") {
          joint.obj.kinetic.setPoints(
            [iface_x, iface_y, joint.obj.p2.x, joint.obj.p2.y]
          );
          joint.obj.p1 = { x: iface_x, y: iface_y };
          Layer1.draw();
        }
        if(joint.point === "p2") {
          joint.obj.kinetic.setPoints(
            [joint.obj.p1.x, joint.obj.p1.y, iface_x, iface_y]
          );
          joint.obj.p2 = { x: iface_x, y: iface_y };
          Layer1.draw();
        }
      });
    }

    var add_event_listeners = function(LoadedSvgs) {
      $('#add_element_btn').click(function(e) {
        e.preventDefault();
        var value = $('#element_selection').val();
        switch(value) {
         case "Server":
           server = new Server(LoadedSvgs, 30, 50);
           server.addinterface();
           server.kinetic.parent_object = server;
           Layer1.add(server.kinetic);
           Layer1.draw();
         break;
         case "Desktop":
           desktop = new Desktop(LoadedSvgs, 30, 50);
           desktop.kinetic.parent_object = desktop;
           desktop.addinterface();
           Layer1.add(desktop.kinetic);
           Layer1.draw();
         break;
         case "Cloud":
           cloud = new Cloud(LoadedSvgs, 30, 50);
           cloud.kinetic.parent_object = cloud;
           cloud.addinterface();
           Layer1.add(cloud.kinetic);
           Layer1.draw();
         break;
         case "CiscoSwitch":
           cisco_switch = new CiscoSwitch(LoadedSvgs, 30, 50);
           cisco_switch.kinetic.parent_object = cisco_switch;
           cisco_switch.addinterface();
           Layer1.add(cisco_switch.kinetic);
           Layer1.draw();
         break;
         case "Router":
           router = new Router(LoadedSvgs, 30, 50);
           router.kinetic.parent_object = router;
           router.addinterface();
           Layer1.add(router.kinetic);
           Layer1.draw();
         break;
         default:
         break;
        }
      });
    };

    var create_control_panel = function() {
      var height = window.innerHeight - $('#container').innerHeight()  - 10;
      var width = $('#container').width();
      var container = "<div id='control_panel'></div>";
      $('body').append(container);
      var control_panel = $('#control_panel');
      control_panel.height(height);
      control_panel.width(width);
      var backgroud_url = './img/background.png';
      control_panel.css('background-image', 'url(' + backgroud_url + ')');
      var element_selection =
        "<select id='element_selection'>" +
          "<option value='Server'>Server</option>" +
          "<option value='Desktop'>Desktop</option>" +
          "<option value='Cloud'>Cloud</option>" +
          "<option value='Router'>Router</option>" +
          "<option value='CiscoSwitch'>CiscoSwitch</option>" +
        "</select>";
      control_panel.append(element_selection);
      var add_element_btn =
       "<button id='add_element_btn'>Add</button>";
      control_panel.append(add_element_btn);
    };

    var getMousePos = function(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }

    var create_staging = function(LoadedSvgs) {
      Stage = new Kinetic.Stage({
        container: 'container',
        width: window.innerWidth,
        height: window.innerHeight / 1.2
      });
      create_control_panel();

      add_event_listeners(LoadedSvgs);
      var background = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: Stage.getWidth(),
        height: Stage.getHeight(),
        fill: 'white'
      });

      Layer0 = new Kinetic.Layer();
      Stage.add(Layer0);
      Layer0.add(background);
      Layer1 = new Kinetic.Layer();
      Stage.add(Layer1);
      Layer0.draw();
      Layer1.draw();

      var bg_canvas = $('canvas')[0]

      var coords = [];
      var first;
      var second;

      var mark_start;
      var mark_current;
      var old_rect;
      var current_rect;
      Layer0.on('mousedown', function(evt) {
        mark_start = getMousePos(bg_canvas, evt);
      });

      Layer0.on('mousemove', function(evt) {
        if(mark_start !== undefined) {
          if(old_rect !== undefined) {
            old_rect.remove();
          }
          mark_current = getMousePos(bg_canvas, evt);
          current_rect = new Kinetic.Rect({
            x: mark_start.x,
            y: mark_start.y,
            width: mark_current.x - mark_start.x,
            height: mark_current.y - mark_start.y,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2
          });
          Layer0.add(current_rect);
          Layer0.draw();
          old_rect = current_rect;
        }
      });

      Layer0.on('mouseup', function(evt) {
        Stage.get('.image').each(function(image) {
          if(colliding_shape(image, current_rect)) {
            image.setStroke('Red');
          } else {
            image.setStroke('');
            image.setStrokeWidth(0);
          }
        });
        current_rect.remove();
        old_rect.remove();
        Layer0.draw();
        Layer1.draw();
        mark_start = undefined;
      });

      Layer1.on('dblclick', function(evt) {
        if(evt.targetNode.className === "Image") {
          evt.targetNode.parent_object.addinterface();
        }
      });
      Layer1.on('click', function(evt) {
        if(evt.targetNode.className === "Circle") {
          coords.push(evt.targetNode.getPosition().x);
          coords.push(evt.targetNode.getPosition().y);
          if(coords.length === 2) {
           first = evt.targetNode;
           evt.targetNode.fill('yellow');
           Layer1.draw();
          }
          if(coords.length === 4) {
            second = evt.targetNode;
            if(first !== second) {
              line = new Joint(coords);
              Joints.push(line);
              first.parent_object.joints.push({point: 'p1', obj: line});
              second.parent_object.joints.push({point: 'p2', obj: line});
              Layer1.add(line.kinetic);
            }
            first.fill('red');
            Layer1.draw();
            coords=[];
            clicks = 0;
          }
        }
      });

      Layer1.draw();
    };

    var load_svgs = function() {
      var Paths = [
        {name: 'Server', path: "./svg/osa_server.svg"},
        {name: 'Desktop', path: "./svg/osa_desktop.svg"},
        {name: 'Router', path: "./svg/osa_device-wireless-router.svg"},
        {name: 'CiscoSwitch', path: "./svg/cisco_workgroup_switch.svg"},
        {name: 'Cloud', path: "./svg/osa_cloud.svg"}
      ];
      var LoadedSvgs = [];

      var ImageCount = Paths.length;

      Paths.forEach(function(obj) {
        var img=new Image();
        img.onload = function() {
          LoadedSvgs.push({name: obj.name, img: img});
          if(LoadedSvgs.length == ImageCount) {
            console.log('Images Loaded');
            create_staging(LoadedSvgs);
          }
        };
        img.src = obj.path;
      });
    };
    return {
      init: init
    };
  })();

  var StageOptions = {
  };
  var Stage;
  var Layer0;
  var Layer1;
  NetworkDrawer.objects.init(Stage);
});
