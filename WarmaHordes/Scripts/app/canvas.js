// Canvas globals
var SCALE = .6;
var MM_TO_INCHES = 25.4;
var BOARD_LENGTH_INCHES = 48; // In inches; two equal sides (4'x4' table)

// Width of the screen in pixels
var SCREEN_WIDTH = (window.innerWidth > 0) ? window.innerWidth : screen.width;
// Canvas width in pixels
var CANVAS_WIDTH = SCREEN_WIDTH * SCALE;
// Canvas height in pixels
var CANVAS_HEIGHT = SCREEN_WIDTH * SCALE;

var UNIT_SMALL_MM = 30;     // 30mm diameter, 1.181102362204724 inches (30/25.4)
var UNIT_MEDIUM_MM = 40;    // 40mm diameter, 1.574803149606299 inches (40/25.4)
var UNIT_LARGE_MM = 50;     // 50mm diameter, 1.968503937007874 inches (50/25.4)
var UNIT_HUGE_MM = 120;     // 120mm diameter, 4.724409448818898 inches (120/25.4)

function inchesToCanvasPixels(val) {
    return ((val / BOARD_LENGTH_INCHES) * CANVAS_WIDTH);
}

function pixelsToCanvasInches(val) {
    return ((val / CANVAS_WIDTH) * BOARD_LENGTH_INCHES);
}

var UNIT_SMALL_DIAMETER = inchesToCanvasPixels(UNIT_SMALL_MM / MM_TO_INCHES) / 2;
var UNIT_MEDIUM_DIAMETER = inchesToCanvasPixels(UNIT_MEDIUM_MM / MM_TO_INCHES) / 2;
var UNIT_LARGE_DIAMETER = inchesToCanvasPixels(UNIT_LARGE_MM / MM_TO_INCHES) / 2;
var UNIT_HUGE_DIAMETER = inchesToCanvasPixels(UNIT_HUGE_MM / MM_TO_INCHES) / 2;

var cBot;
var cBotContext;
var cMid;
var cMidContext;
var cTop;
var cTopContext;

var cObjects = [];
var cSelectedObjects = [];
var cHoverObjects = [];
var copyArray = null;

var DEBUG_MODE = false;
var WINDOW_INTERVAL = 20;

var STATE_MOUSEDOWN_JUST_SELECTED = false;  // true/false
var STATE_MOUSEDOWN_SELECTED = null;        // null/id
var STATE_LEFT_CLICK_DOWN = null;           // null/id
var STATE_RIGHT_CLICK_DOWN = null;          // null/id
var STATE_MIDDLE_CLICK_DOWN = null;         // null/id

var MOUSEDOWN_COLLISION = null;             // {x, y}
var MOUSEDOWN_LOCATION = null;              // {x, y}
var MOUSEDOWN_LOCATION_CURRENT = null;      // {x, y}
var MOUSEUP_COLLISION = null;               // {x, y}

var DEFAULT_LINE_WIDTH = 1;
var DEFAULT_COLOR = "black";
var DEFAULT_ROTATION = 0;
var DEFAULT_ROTATION_SPEED = 10;
var DEFAULT_FRONT_ANGLE = 180;
var DEFAULT_FRONT_COLOR = "white";
var DEFAULT_FRONT_LINE_COLOR = "red";

var DEFAULT_TAPE_MEASURER_FILL_COLOR = "white";
var DEFAULT_TAPE_MEASURER_COLOR = "green";
var DEFAULT_TAPE_MEASURER_WIDTH = "2";

var OBJECT_SELECTED_LINE_COLOR = "#7CFC00";
var OBJECT_SELECTED_LINE_WIDTH = 4;
var OBJECT_TYPE_CIRCLE = "circle";
var OBJECT_TYPE_RECTANGLE_EMPTY = "rect";
var OBJECT_TYPE_TAPE_MEASURER = "tMeasure";
var OBJECT_TYPE_RADIUS = "objectRadius";

var OBJECT_MAX_SRC_LENGTH = 60000;

var STORAGE_OBJECTS_NAME = "cObjects";
var STORAGE_CHAT_NAME = "chatHistory";
var STORAGE_LOG_NAME = "logHistory";
var STORAGE_AVATAR_NAME = "avatarSrc";
var STORAGE_CLIENT_TOKENS = "tokensClient";

var SELECTED_TOKEN_ID = "";

var INITIAL_LOAD = true;

// Global vals that affect the canvas as a whole
var GLOBAL_DISABLE_UNIT_COLLISION = true;

function init() {
    // Get and init all canvas layers
    $("#divCanvas").height = CANVAS_HEIGHT;
    $("#divCanvas").width = CANVAS_WIDTH;
    cBot = document.getElementById("cBot");
    cBotContext = cBot.getContext("2d");
    cBotContext.canvas.height = CANVAS_HEIGHT;
    cBotContext.canvas.width = CANVAS_WIDTH;
    cMid = document.getElementById("cMid");
    cMidContext = cMid.getContext("2d");
    cMidContext.canvas.height = CANVAS_HEIGHT;
    cMidContext.canvas.width = CANVAS_WIDTH;
    cTop = document.getElementById("cTop");
    cTopContext = cTop.getContext("2d");
    cTopContext.canvas.height = CANVAS_HEIGHT;
    cTopContext.canvas.width = CANVAS_WIDTH;

    // Set window interval to start canvas re-draw
    setInterval(drawAll, WINDOW_INTERVAL);

    // Add event listeners
    // [Mouse] events
    cTop.addEventListener("mousedown", canvasClickDown, false);
    cTop.addEventListener("mouseup", canvasClickUp, false);
    cTop.addEventListener("mousemove", canvasMouseMove, false);

    // IE9+, Chrome, Safari, Opera
    // Scroll isn't detected easily on canvas so we're tying this to the window itself instead
    window.addEventListener("mousewheel", canvasScroll, false);
    // Firefox
    // Scroll isn't detected easily on canvas so we're tying this to the window itself instead
    window.addEventListener("DOMMouseScroll", canvasScroll, false);
    // IE 6/7/8
    // Scroll isn't detected easily on canvas so we're tying this to the window itself instead
    window.addEventListener("onmousewheel", canvasScroll, false);

    // [Key] events
    // Keydown isn't detected easily with canvas so we're tying this to the window itself instead
    window.addEventListener("keydown", canvasKeyDown, false);

    // [Window] events
    window.addEventListener("resize", updateCanvasDimensions, false);

    // Add events for token creation
    $("#btnCreateToken").click(createToken);

    $("#imgToken").click(function () {
        $("#inputToken").click();
    });

    $("#tokenMenuSmall").click(function () {
        $("#btnTokenMenu").text($(this).text());
    });
    $("#tokenMenuMedium").click(function () {
        $("#btnTokenMenu").text($(this).text());
    });
    $("#tokenMenuLarge").click(function () {
        $("#btnTokenMenu").text($(this).text());
    });
    $("#tokenMenuHuge").click(function () {
        $("#btnTokenMenu").text($(this).text());
    });

    // Add events for avatar selection
    $("#inputAvatar").change(setAvatar);
    $("#imgAvatar").click(function () {
        $("#inputAvatar").click();
    });

    // Update board state from local storage
    loadStorage();

    // Selected objects are discarded on page load, aka, if this value is true.
    INITIAL_LOAD = false;

    // Assign initial canvas values w/update function
    updateCanvasDimensions();
}

function log(msg) {
    if (DEBUG_MODE)
        console.log(msg);
}

function loadStorage() {
    var avatar = getAvatar();
    cObjects = getFromStorage(STORAGE_OBJECTS_NAME) || [];
    var chatItems = getFromStorage(STORAGE_CHAT_NAME) || [];
    var logItems = getFromStorage(STORAGE_LOG_NAME) || [];

    // Drops selection colors from objects
    // NOTE: May cause unintended issues if I use the properties for temporary color changes to objects for other purposes in the future ...
    if (INITIAL_LOAD) {
        for (var i = 0; i < cObjects.length; i++)
            revertObjColor(cObjects[i].id);
    }

    if (avatar !== null)
        saveAvatar(avatar);

    // Get chat items from storage
    for (var i = 0; i < chatItems.length; i++) {
        $("#chatWindow").append(getChatListItem(chatItems[i].name, chatItems[i].msg));
    }

    // Get log items from storage
    for (var i = 0; i < logItems.length; i++) {
        $("#logWindow").append(getLogRollListItem(logItems[i].name, logItems[i].msg));
    }

    // Scroll to the bottom of the chat
    if (chatItems.length > 0)
        $("#chatWindowDiv").stop().animate({
            scrollTop: $("#chatWindow li").last().offset().top
        },
            "fast");

    // Scroll to the bottom of the log
    if (logItems.length > 0)
        $("#logWindowDiv").stop().animate({
            scrollTop: $("#logWindow li").last().offset().top
        },
            "fast");
}

function resetLocalStorage() {
    saveToStorage(STORAGE_OBJECTS_NAME, []);
    saveToStorage(STORAGE_CHAT_NAME, []);
    saveToStorage(STORAGE_LOG_NAME, []);
}

function updateObjectStorage() {
    // Update the stored values for cObjects
    saveToStorage(STORAGE_OBJECTS_NAME, cObjects);
}

function saveToStorage(name, obj) {
    localStorage.setItem(name, JSON.stringify(obj));
}

function addToStorage(name, obj) {
    var currValue = getFromStorage(name) || [];
    currValue.push(obj);

    localStorage.setItem(name, JSON.stringify(currValue));
}

function deleteFromStorageById(name, id) {
    var currValue = getFromStorage(name) || [];

    currValue = $.grep(currValue,
        function (e) {
            return e.id !== id;
        });

    localStorage.setItem(name, JSON.stringify(currValue));
}

function getFromStorage(name) {
    return JSON.parse(localStorage.getItem(name));
}

function deleteSelectedObjects() {
    for (var i = 0; i < cSelectedObjects.length; i++) {
        var obj = cObjects.find(x => x.id === cSelectedObjects[i].id);

        if (obj === undefined) {
            /* Do Nothing */
        } else {
            serverRemoveObj(obj);
            removeFromObjArray(obj.id);
        }
    }

    cSelectedObjects = [];
}

function drawAll() {
    clearCanvas(cBotContext);
    clearCanvas(cMidContext);
    clearCanvas(cTopContext);

    drawMap(cBotContext);
    //drawTitle(cMidContext);
    drawObjects(cTopContext);
    drawHoverObjects(cTopContext);
}

function canvasKeyDown(e) {
    var key = e.which || e.keyCode; // keyCode detection
    var ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false); // ctrl detection


    if (key === 86 && ctrl && copyArray !== null) { // CTRL + V
        for (var i = 0; i < copyArray.length; i++) {
            var obj = copyArray[i];

            switch (obj.type) {
                case OBJECT_TYPE_CIRCLE:
                    drawCircle(cTopContext, { x: obj.x, y: obj.y }, obj.radius, obj.baseColor, obj.rotation, obj.src);
                    break;
            }
        }
        copyArray = null;
    } else if (key === 67 && ctrl) { // CTRL + C
        copyArray = cSelectedObjects;
    }

    switch (key) {
        case 46: // Delete key
            deleteSelectedObjects();
            break;
        default:
    }

    // Numeric keys and keypad (0-9) and `, which is used for .5
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105) || e.keyCode === 192) {
        // 1-9, creates an AoE around the piece equal to the number for all selected pieces
        if (cSelectedObjects.length > 0) {
            // 0 key, removes the AoE around selected pieces
            if (e.keyCode === 48 || e.keyCode === 96)
                cHoverObjects = [];
            else {
                // ` key is the default at .5 inches. Anything besides ` key, we use that value instead (0-9)
                var radiusIncrease = e.keyCode === 192 ? inchesToCanvasPixels(.5) : inchesToCanvasPixels(e.key);
                cHoverObjects = cHoverObjects = JSON.parse(JSON.stringify(cSelectedObjects));

                for (var i = 0; i < cHoverObjects.length; i++) {
                    cHoverObjects[i].type = OBJECT_TYPE_RADIUS;
                    cHoverObjects[i].radius += radiusIncrease; //? Translate the keycodes into actual keys btw.
                }
            }
        }
    }

    updateObjectStorage();
}

function canvasClickDown(e) {
    var context = this.getContext("2d");
    var mouse = getMousePos(this, e);
    e.preventDefault();

    switch (event.which) {
        case 1:
            STATE_LEFT_CLICK_DOWN = true;
            canvasLeftClickDown(mouse, context);

            log("Left Mouse button pressed DOWN.");
            break;
        case 2:
            STATE_MIDDLE_CLICK_DOWN = true;
            canvasMiddleClickDown(mouse, context);

            log("Middle Mouse button pressed DOWN.");
            break;
        case 3:
            STATE_RIGHT_CLICK_DOWN = true;
            canvasRightClickDown(mouse, context);

            log("Right Mouse button pressed DOWN.");
            break;
        default:
    }

    // At the end of every mouse cllick down and up, we update the storage.
    updateObjectStorage();
}

function canvasClickUp(e) {
    var context = this.getContext("2d");
    var mouse = getMousePos(this, e);
    e.preventDefault();

    switch (event.which) {
        case 1:
            STATE_LEFT_CLICK_DOWN = null;
            canvasLeftClickUp(mouse, context);

            log("Left Mouse button pressed UP.");
            break;
        case 2:
            STATE_MIDDLE_CLICK_DOWN = null;

            log("Middle Mouse button pressed UP.");
            break;
        case 3:
            STATE_RIGHT_CLICK_DOWN = null;
            canvasRightClickUp(mouse, context);

            log("Right Mouse button pressed UP.");
            break;
        default:
    }

    // At the end of every mouse cllick down and up, we update the storage.
    updateObjectStorage();
}

function canvasLeftClickDown(mouse, context) {
    // Record the mouse down location for drag/drop and selection purposes
    MOUSEDOWN_LOCATION = mouse;

    // Check if the mouse click hit anything
    MOUSEDOWN_COLLISION = getClickCollision(mouse);

    // If nothing was clicked on, affect the canvas
    if (MOUSEDOWN_COLLISION === null) {
        STATE_MOUSEDOWN_SELECTED = null;
    } else { // If something was clicked, record that selection so it can be acted on in Mouse Down
        STATE_MOUSEDOWN_SELECTED = MOUSEDOWN_COLLISION.id;
    }

    // If something was clicked, and it was not already selected, select it
    // NOTE: May be able to make this into one IF statement
    if (STATE_MOUSEDOWN_SELECTED !== null) {
        var obj = cSelectedObjects.find(x => x.id === STATE_MOUSEDOWN_SELECTED);

        if (obj === undefined) {
            STATE_MOUSEDOWN_JUST_SELECTED = true;
            toggleObjSelected(MOUSEDOWN_COLLISION);
        }
    }
}

function canvasLeftClickUp(mouse, context) {
    // Check if the mouse click hit anything we are about
    MOUSEUP_COLLISION = getClickCollision(mouse);

    // If MouseDown collided with an object AND MouseUp did NOT collide with an object ...
    // AND MouseDown selected an object OR selected objects exists
    if (MOUSEDOWN_COLLISION &&
        (MOUSEUP_COLLISION === null || GLOBAL_DISABLE_UNIT_COLLISION) &&
        (STATE_MOUSEDOWN_SELECTED !== null || cSelectedObjects.length > 0)) {
        // Drop the objects where you dragged them to
        for (var i = 0; i < cSelectedObjects.length; i++) {
            moveObj(cSelectedObjects[i].id, mouse.x - MOUSEDOWN_LOCATION.x, mouse.y - MOUSEDOWN_LOCATION.y);
        }

        // Clear the selection now that the items have been moved
        clearSelectedObjects();
    } else if (MOUSEDOWN_COLLISION && MOUSEUP_COLLISION) {
        /* Do nothing. the object was already selected */
    } else
        // If no movement occurs, clear the selection now that the items have been moved
        clearSelectedObjects();

    if (MOUSEUP_COLLISION === null) { /* Do nothing */
    }
        // If the MouseDown and MouseUp objects are the same, de-select the object
    else if (STATE_MOUSEDOWN_SELECTED === MOUSEUP_COLLISION.id && STATE_MOUSEDOWN_JUST_SELECTED === false) {
        toggleObjSelected(MOUSEUP_COLLISION);
    }

    // Look for items inside the selection box, if it exists
    groupSelect();

    STATE_MOUSEDOWN_JUST_SELECTED = false;
    MOUSEDOWN_LOCATION = null;
    MOUSEDOWN_LOCATION_CURRENT = null;
    resetHoverSelection("");
    STATE_MOUSEDOWN_SELECTED = null;
}

function canvasRightClickDown(mouse, context) {
    // Record the mouse down location for drag/drop and selection purposes
    MOUSEDOWN_LOCATION = mouse;

    // Remove hover t measurer from client if it exists
    removeHoverTapeMeasurer();
    // Remove object t measurer from client if it exists
    var objToRemove = removeObjectTapeMeasurer();
    //  Broadcast any removed tape measurers to other clients
    for (var i = 0; i < objToRemove.length; i++)
        serverRemoveObj(objToRemove[i]);

    // Check if the mouse click hit anything we care about
    var collision = getClickCollision(mouse);

    // If nothing was clicked on, affect the canvas
    if (collision === null) {
        //drawCircle(context, mouse, UNIT_SMALL_DIAMETER, 'blue');
        STATE_MOUSEDOWN_SELECTED = false;
    }
}

function canvasRightClickUp(mouse, context) {
    // Check if the mouse click hit anything we care about
    var collision = getClickCollision(mouse);

    // Add the tape measurer object if it exists
    var tMeasure = getTapeMeasurer();
    if (tMeasure !== null)
        drawTapeMeasurer(tMeasure[0]);

    STATE_MOUSEDOWN_JUST_SELECTED = false;
    MOUSEDOWN_LOCATION = null;
    MOUSEDOWN_LOCATION_CURRENT = null;
    resetHoverSelection(OBJECT_TYPE_RADIUS);
    STATE_MOUSEDOWN_SELECTED = null;
}

function canvasMiddleClickDown(mouse, context) {
    clearSelectedObjects();
}

function canvasMouseMove(e) {
    var mouse = getMousePos(this, e);
    //log('canvasMouseMove[' + mouse.x + ',' + mouse.y + '], MOUSEDOWN_LOCATION[' + MOUSEDOWN_LOCATION + '], MOUSEDOWN_LOCATION_CURRENT[' + MOUSEDOWN_LOCATION_CURRENT + ']');

    // Update MOUSEDOWN_LOCATION_CURRENT to the current position of the mouse
    MOUSEDOWN_LOCATION_CURRENT = mouse;

    // Check if the left mouse button is currently being held down AND the left click collided with an object.
    if (MOUSEDOWN_LOCATION !== null && MOUSEDOWN_COLLISION !== null) {
        // Add currently selected objects to the hover objects array for rendering.
        //for (var i = 0; i < cSelectedObjects.length; i++)
        //    cHoverObjects.push(cSelectedObjects[i]);

        // NOTE: This could be handled much more efficienctly but I'm just not bothering to fix it right now
        if (hoverObjArrayContainsType(OBJECT_TYPE_CIRCLE).length === 0) {
            var objRadii = hoverObjArrayContainsType(OBJECT_TYPE_RADIUS);
            cHoverObjects = JSON.parse(JSON.stringify(cSelectedObjects));

            for (var i = 0; i < objRadii.length; i++)
                cHoverObjects.push(objRadii[i]);
        }
    }

    // Check if the mouse click hit anything
    var collision = getClickCollision(mouse);

    // Check if the LEFT mouse button is currently being held down. If nothing was clicked on, start the top left of the rectangle for the drag-select box
    if (STATE_LEFT_CLICK_DOWN &&
        MOUSEDOWN_COLLISION === null &&
        MOUSEDOWN_LOCATION !== null &&
        collision === null &&
        hoverObjArrayContainsType(OBJECT_TYPE_RECTANGLE_EMPTY).length === 0) {
        cHoverObjects.push({
            "id": guidGenerator(),
            "type": OBJECT_TYPE_RECTANGLE_EMPTY,
            "selected": null,
            "x": mouse.x,
            "y": mouse.y,
            "width": MOUSEDOWN_LOCATION_CURRENT.x - MOUSEDOWN_LOCATION.x,
            "height": MOUSEDOWN_LOCATION_CURRENT.y - MOUSEDOWN_LOCATION.y,
            "color": null,
            "baseColor": DEFAULT_COLOR,
            "lineWidth": null,
            "lineColor": null,
            "baseLineColor": DEFAULT_COLOR,
            "baseLineWidth": DEFAULT_LINE_WIDTH
        });
    }

    // Check if the RIGHT mouse button is currently being held down. If nothing was clicked on, start the begin point of the tape measurer
    if (STATE_RIGHT_CLICK_DOWN &&
        MOUSEDOWN_LOCATION !== null &&
        hoverObjArrayContainsType(OBJECT_TYPE_TAPE_MEASURER).length === 0) {
        cHoverObjects.push({
            "id": guidGenerator(),
            "type": OBJECT_TYPE_TAPE_MEASURER,
            "selected": null,
            "x": mouse.x,
            "y": mouse.y,
            "endX": null,
            "endY": null,
            "width": MOUSEDOWN_LOCATION_CURRENT.x - MOUSEDOWN_LOCATION.x,
            "height": MOUSEDOWN_LOCATION_CURRENT.y - MOUSEDOWN_LOCATION.y,
            "color": null,
            "baseColor": DEFAULT_TAPE_MEASURER_COLOR,
            "lineWidth": null,
            "lineColor": null,
            "baseLineColor": DEFAULT_TAPE_MEASURER_COLOR,
            "baseLineWidth": DEFAULT_TAPE_MEASURER_WIDTH
        });
    }

    updateHoverObjects();
}

function canvasScroll(e) {
    if (cSelectedObjects.length <= 0 || clickedOnCanvas(e, cTop) === false) {
        return;
    }

    //// NOTE: Need two checks for multiple browser support
    //if (e.detail < 0) {
    //    // Scroll up
    //    for (var i = 0; i < cSelectedObjects.length; i++) {
    //        cSelectedObjects[i].rotation += DEFAULT_ROTATION_SPEED;
    //    }
    //} else {
    //    // Scroll down
    //    for (var i = 0; i < cSelectedObjects.length; i++) {
    //        cSelectedObjects[i].rotation -= DEFAULT_ROTATION_SPEED;
    //    }
    //}

    // Prevent scrolling while the User cursor is inside the canvas
    e.preventDefault();
    var i = 0;
    if (e.wheelDelta < 0) {
        // Scroll up
        for (i = 0; i < cSelectedObjects.length; i++) {
            cSelectedObjects[i].rotation += DEFAULT_ROTATION_SPEED;
            // Send the updated obj to the server
            serverUpdateObj(cSelectedObjects[i]);
        }
    } else {
        // Scroll down
        for (i = 0; i < cSelectedObjects.length; i++) {
            cSelectedObjects[i].rotation -= DEFAULT_ROTATION_SPEED;
            // Send the updated obj to the server
            serverUpdateObj(cSelectedObjects[i]);
        }
    }

    // At the end of every mouse scroll, the object storage must be updated. Otherwise we lose rotation changes
    updateObjectStorage();
}

function updateHoverObjects() {
    // Update coordinates for hover objects, so long as the user is still holding down Left Click and they've moved their mouse at all
    if (cHoverObjects.length > 0 && MOUSEDOWN_LOCATION !== null && MOUSEDOWN_LOCATION_CURRENT !== null) {
        for (var i = 0; i < cHoverObjects.length; i++) {
            var hoverObj = cHoverObjects[i];
            // NOTE: Could make this more efficient ... maybe add an xStart and yStart to each hover obj.
            var origObj = cSelectedObjects.find(x => x.id === hoverObj.id);

            log("cHoverObjects count:[" + cHoverObjects.length + "]");

            switch (hoverObj.type) {
                case OBJECT_TYPE_CIRCLE:
                    log("cHoverObjects CIRCLE");

                    hoverObj.x = origObj.x + (MOUSEDOWN_LOCATION_CURRENT.x - MOUSEDOWN_LOCATION.x);
                    hoverObj.y = origObj.y + (MOUSEDOWN_LOCATION_CURRENT.y - MOUSEDOWN_LOCATION.y);
                    break;
                case OBJECT_TYPE_RECTANGLE_EMPTY:
                    log("cHoverObjects RECTANGLE");

                    hoverObj.width = MOUSEDOWN_LOCATION_CURRENT.x - MOUSEDOWN_LOCATION.x;
                    hoverObj.height = MOUSEDOWN_LOCATION_CURRENT.y - MOUSEDOWN_LOCATION.y;
                    break;
                case OBJECT_TYPE_TAPE_MEASURER:
                    log("cHoverObjects TAPE MEASURER");

                    hoverObj.endX = MOUSEDOWN_LOCATION_CURRENT.x;
                    hoverObj.endY = MOUSEDOWN_LOCATION_CURRENT.y;
                    break;
            }
        }
    }
}

function groupSelect() {
    // If a selection rectangle is currently being drawn, select the items below it
    if (cHoverObjects.length === 1 && cHoverObjects[0].type === OBJECT_TYPE_RECTANGLE_EMPTY) {
        var rect = cHoverObjects[0];
        var rectXMin = rect.x;
        var rectXMax = rect.x + rect.width;
        var rectYMin = rect.y;
        var rectYMax = rect.y + rect.height;
        var xMin = rectXMin < rectXMax ? rectXMin : rectXMax;
        var xMax = rectXMax > rectXMin ? rectXMax : rectXMin;
        var yMin = rectYMin < rectYMax ? rectYMin : rectYMax;
        var yMax = rectYMax > rectYMin ? rectYMax : rectYMin;

        for (var i = 0; i < cObjects.length; i++) {
            var currObj = cObjects[i];

            switch (currObj.type) {
                case OBJECT_TYPE_CIRCLE:
                    //if (currObj.x + currObj.radius * SCALE >= xMin && currObj.x - currObj.radius * SCALE <= xMax &&
                    //    currObj.y + currObj.radius * SCALE >= yMin && currObj.y - currObj.radius * SCALE <= yMax)
                    if (currObj.x + currObj.radius >= xMin &&
                        currObj.x - currObj.radius <= xMax &&
                        currObj.y + currObj.radius >= yMin &&
                        currObj.y - currObj.radius <= yMax)
                        toggleObjSelected(currObj);
                    break;
            }
        }
    }
}

function clearCanvas(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function clearSelectedObjects() {
    for (var i = 0; i < cSelectedObjects.length; i++)
        revertObjColor(cSelectedObjects[i].id);

    cSelectedObjects = [];
}

function moveObj(id, x, y) {
    var obj = cObjects.find(x => x.id === id);

    if (obj === undefined) { /* Do nothing */
    } else {
        obj.x += x;
        obj.y += y;

        serverMoveObj(obj);
    }
}

function drawTitle(context) {
    context.font = "60px Calibri";
    context.fillText("InfyTable", (CANVAS_WIDTH / 2) - 200, 60);
}

function drawObjects(context) {
    // Iterate through all objects currently saved and draw them according to their type
    for (var i = 0; i < cObjects.length; i++) {
        var obj = cObjects[i];
        switch (obj.type) {
            case OBJECT_TYPE_CIRCLE:
                drawObjectCircle(context, obj);
                break;

            case OBJECT_TYPE_TAPE_MEASURER:
                drawObjectTapeMeasurer(context, obj);
                break;
        }
    }
}

function drawObjectCircle(context, obj) {
    // Draw the circle 
    context.beginPath();
    context.globalAlpha = 1;
    //context.arc(obj.x, obj.y, obj.radius * SCALE, 0, 2 * Math.PI, false);
    context.arc(obj.x,
        obj.y,
        obj.radius,
        toRadians(obj.rotation),
        toRadians(obj.rotation + DEFAULT_FRONT_ANGLE),
        false);
    context.fillStyle = obj.color || obj.baseColor || DEFAULT_COLOR;
    context.fill();
    context.lineWidth = obj.lineWidth || obj.baseLineWidth;
    context.strokeStyle = obj.lineColor || obj.baseLineColor || DEFAULT_COLOR;
    context.stroke();

    // Front circle arc
    context.beginPath();
    context.globalAlpha = 1;
    context.arc(obj.x, obj.y, obj.radius, toRadians(obj.rotation), toRadians(obj.rotation + DEFAULT_FRONT_ANGLE), true);
    context.fillStyle = DEFAULT_FRONT_LINE_COLOR;
    context.fill();
    context.lineWidth = obj.lineWidth || obj.baseLineWidth;
    context.strokeStyle = DEFAULT_FRONT_LINE_COLOR;
    context.stroke();

    // Token image: fill with the src of the obj/token if it exists
    if (obj.src !== null) {
        var img = new Image();
        img.src = obj.src;
        var imgScale = 2;
        var imgClipScale = .95;

        context.save();
        context.beginPath();
        context.arc(obj.x, obj.y, obj.radius * imgClipScale, 0, 2 * Math.PI, false);
        context.clip();
        //context.drawImage(img, obj.x - (obj.radius * .8) * SCALE, obj.y - (obj.radius * .8), obj.radius * 1.75, obj.radius * 1.75);
        context.drawImage(img, obj.x - obj.radius, obj.y - obj.radius, obj.radius * imgScale, obj.radius * imgScale);
        context.restore();
    }
}

function drawObjectTapeMeasurer(context, obj) {
    context.fillStyle = DEFAULT_TAPE_MEASURER_FILL_COLOR;
    context.strokeStyle = DEFAULT_TAPE_MEASURER_COLOR;

    context.beginPath();
    context.lineWidth = obj.lineWidth || obj.baseLineWidth;
    context.strokeStyle = obj.lineColor || obj.baseLineColor || DEFAULT_COLOR;
    context.moveTo(obj.x, obj.y);
    context.lineTo(obj.endX, obj.endY);
    context.stroke();

    // Draw the distance text
    var distance = canvasDistance({ x: obj.x, y: obj.y }, { x: obj.endX, y: obj.endY });
    context.font = "30pt Consolas";
    context.fillText(distance, obj.endX + 5, obj.endY + 5);
    context.strokeText(distance, obj.endX + 5, obj.endY + 5);
    context.stroke();
    context.fill();
}

function drawHoverObjects(context) {
    // Iterate through all objects currently saved and draw them according to their type
    for (var i = 0; i < cHoverObjects.length; i++) {
        var obj = cHoverObjects[i];
        switch (obj.type) {
            case OBJECT_TYPE_CIRCLE:
                drawHoverCircle(context, obj);
                break;

            case OBJECT_TYPE_RECTANGLE_EMPTY:
                drawHoverRectangle(context, obj);
                break;

            case OBJECT_TYPE_RADIUS:
                drawHoverRadius(context, obj);
                break;

            case OBJECT_TYPE_TAPE_MEASURER:
                drawHoverTapeMeasurer(context, obj);
                break;
        }
    }
}

function drawHoverCircle(context, obj) {
    context.beginPath();
    context.globalAlpha = .5;
    //context.arc(obj.x, obj.y, obj.radius * SCALE, 0, 2 * Math.PI, false);
    context.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI, false);
    context.fillStyle = obj.color || obj.baseColor || DEFAULT_COLOR;
    context.fill();
    context.lineWidth = obj.lineWidth || obj.baseLineWidth;
    context.strokeStyle = obj.lineColor || obj.baseLineColor || DEFAULT_COLOR;
    context.stroke();
}

function drawHoverRectangle(context, obj) {
    context.beginPath();
    context.globalAlpha = .5;
    context.rect(obj.x, obj.y, obj.width, obj.height);
    context.lineWidth = obj.lineWidth || obj.baseLineWidth;
    context.strokeStyle = obj.lineColor || obj.baseLineColor || DEFAULT_COLOR;
    context.stroke();
}

function drawHoverRadius(context, obj) {
    context.beginPath();
    context.globalAlpha = .15;
    //context.arc(obj.x, obj.y, obj.radius * SCALE, 0, 2 * Math.PI, false);
    context.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI, false);
    context.fillStyle = obj.color || obj.baseColor || DEFAULT_COLOR;
    context.fill();
    context.lineWidth = obj.lineWidth || obj.baseLineWidth;
    context.strokeStyle = obj.lineColor || obj.baseLineColor || DEFAULT_COLOR;
    context.stroke();
}

function drawHoverTapeMeasurer(context, obj) {
    context.strokeStyle = obj.lineColor || obj.baseLineColor || DEFAULT_COLOR;
    context.fillStyle = DEFAULT_TAPE_MEASURER_FILL_COLOR;

    // Draw the line
    context.beginPath();
    context.globalAlpha = .5;
    context.moveTo(obj.x, obj.y);
    context.lineTo(obj.endX, obj.endY);
    context.lineWidth = obj.lineWidth || obj.baseLineWidth;
    context.stroke();

    // Draw the distance text
    var distance = canvasDistance({ x: obj.x, y: obj.y },
        { x: MOUSEDOWN_LOCATION_CURRENT.x, y: MOUSEDOWN_LOCATION_CURRENT.y });
    context.font = "30pt Consolas";
    context.fillText(distance, MOUSEDOWN_LOCATION_CURRENT.x + 5, MOUSEDOWN_LOCATION_CURRENT.y + 5);
    context.strokeStyle = DEFAULT_TAPE_MEASURER_COLOR;
    context.strokeText(distance, MOUSEDOWN_LOCATION_CURRENT.x + 5, MOUSEDOWN_LOCATION_CURRENT.y + 5);
    context.stroke();
    context.fill();
}

function drawMap(context) {
    var image = new Image();
    //image.src = getGrass();
    //image.src = getSand();
    //image.src = getSnow();
    image.src = getMap();

    //context.fillStyle = context.createPattern(image, "no-repeat");
    //context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function removeFromObjArray(id) {
    cObjects = $.grep(cObjects,
        function (e) {
            return e.id !== id;
        });
}

function getFromObjArray(id) {
    var objArray = $.grep(cObjects,
        function (e) {
            return e.id === id;
        });

    return objArray;
}

function removeFromHoverObjArray(id) {
    cHoverObjects = $.grep(cHoverObjects,
        function (e) {
            return e.id !== id;
        });
}

function getFromHoverObjArray(id) {
    var objArray = $.grep(cHoverObjects,
        function (e) {
            return e.id === id;
        });

    return objArray;
}

function hoverObjArrayContainsType(type) {
    var objArray = $.grep(cHoverObjects,
        function (e) {
            return e.type === type;
        });

    return objArray;
}

function toggleObjSelected(obj) {
    var id = obj.id;

    if (cSelectedObjects.indexOf(id) >= 0) {
        cSelectedObjects = $.grep(cSelectedObjects,
            function (e) {
                return e !== id;
            });

        revertObjColor(id);
    } else {
        cSelectedObjects.push(obj);
        changeObjLine(id, OBJECT_SELECTED_LINE_WIDTH, OBJECT_SELECTED_LINE_COLOR);
    }

    log(cSelectedObjects);
}

function changeObjLine(id, newLineWidth, newLineColor) {
    var obj = cObjects.find(x => x.id === id);

    if (obj === undefined) { /* Do nothing */
    } else {
        if (newLineWidth !== "undefined")
            obj.lineWidth = newLineWidth;
        if (newLineWidth !== "undefined")
            obj.lineColor = newLineColor;
    }
}

function revertObjColor(id) {
    var obj = cObjects.find(x => x.id === id);

    if (obj === undefined) { /* Do nothing */
    } else {
        obj.color = obj.baseColor || DEFAULT_COLOR;
        obj.lineColor = obj.baseLineColor || DEFAULT_COLOR;
        obj.lineWidth = obj.baseLineWidth || DEFAULT_LINE_WIDTH;
    }
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function clickedOnCanvas(e, canvas) {
    var rect = canvas.getBoundingClientRect();

    if (e.x >= rect.left && e.x <= rect.right && e.y >= rect.top && e.y <= rect.bottom)
        return true;
    else
        return false;
}

function getClickCollision(evt) {
    // Return the first object the mouse click hits
    for (var i = 0; i < cObjects.length; i++) {
        var obj = cObjects[i];
        switch (obj.type) {
            case OBJECT_TYPE_CIRCLE:
                //if (evt.x >= obj.x - obj.radius * SCALE && evt.x <= obj.x + obj.radius * SCALE &&
                //    evt.y >= obj.y - obj.radius * SCALE && evt.y <= obj.y + obj.radius * SCALE)
                if (evt.x >= obj.x - obj.radius &&
                    evt.x <= obj.x + obj.radius &&
                    evt.y >= obj.y - obj.radius &&
                    evt.y <= obj.y + obj.radius)
                    return obj;
                break;
        }
    }

    return null;
}

function drawCircle(context, mouseclick, radius, color, rotation, src) {
    var x = mouseclick.x;
    var y = mouseclick.y;

    var newObj = {
        "id": guidGenerator(),
        "selected": null,
        "type": OBJECT_TYPE_CIRCLE,
        "x": x,
        "y": y,
        "radius": radius,
        "rotation": rotation || DEFAULT_ROTATION,
        "src": src || null,
        "color": null,
        "baseColor": color,
        "lineWidth": null,
        "lineColor": null,
        "baseLineColor": DEFAULT_COLOR,
        "baseLineWidth": DEFAULT_LINE_WIDTH
    };
    cObjects.push(newObj);
    serverAddObj(newObj);
}

function drawTapeMeasurer(obj) {
    cObjects.push(obj);
    serverAddObj(obj);
}

function getTapeMeasurer() {
    var objArray = $.grep(cHoverObjects,
        function (e) {
            return e.type === OBJECT_TYPE_TAPE_MEASURER;
        });

    if (objArray.length === 0)
        return null;

    return objArray;
}

function resetHoverSelection(type) {
    // Remove everything from cHoverObjects except the passed in type
    cHoverObjects = hoverObjArrayContainsType(type);
}

function removeHoverTapeMeasurer() {
    var objToBeRemoved = $.grep(cHoverObjects,
        function (e) {
            return e.type === OBJECT_TYPE_TAPE_MEASURER;
        });

    cHoverObjects = $.grep(cHoverObjects,
        function (e) {
            return e.type !== OBJECT_TYPE_TAPE_MEASURER;
        });

    return objToBeRemoved;
}

function removeObjectTapeMeasurer() {
    var objToBeRemoved = $.grep(cObjects,
        function (e) {
            return e.type === OBJECT_TYPE_TAPE_MEASURER;
        });

    cObjects = $.grep(cObjects,
        function (e) {
            return e.type !== OBJECT_TYPE_TAPE_MEASURER;
        });

    return objToBeRemoved;
}

function updateCanvasDimensions() {
    // Update the screen dimensions in case they changed their window size
    SCREEN_WIDTH = (window.innerWidth > 0) ? window.innerWidth : screen.width;

    // Update canvas globals
    CANVAS_WIDTH = SCREEN_WIDTH * SCALE; // Canvas width in pixels
    CANVAS_HEIGHT = SCREEN_WIDTH * SCALE; // Canvas height in pixels

    // Update the HTML elements for the canvas
    $("#divCanvas").height = CANVAS_HEIGHT;
    $("#divCanvas").width = CANVAS_WIDTH;
    cBotContext.canvas.height = CANVAS_HEIGHT;
    cBotContext.canvas.width = CANVAS_WIDTH;
    cMidContext.canvas.height = CANVAS_HEIGHT;
    cMidContext.canvas.width = CANVAS_WIDTH;
    cTopContext.canvas.height = CANVAS_HEIGHT;
    cTopContext.canvas.width = CANVAS_WIDTH;
}

function serverAddObj(val) {
    gObjHub.server.sendAdd(val);
}

function serverUpdateObj(val) {
    gObjHub.server.sendUpdate(val);
}

function serverRemoveObj(val) {
    gObjHub.server.sendRemove(val);
}

function serverMoveObj(val) {
    gObjHub.server.sendMove(val);
}

function serverLog(val) {
    gLogHub.server.send(val);
}

function getChatListItem(name, msg) {
    return '<li class="list-group-item"><strong>' + name + "</strong>:&nbsp;&nbsp;" + msg + "</li>";
}

function getLogRollListItem(name, msg) {
    return '<li class="list-group-item"><span class="rollBadge pull-left">' +
        name +
        "</span>&nbsp;&nbsp;" +
        msg +
        "</li>";
}

function setAvatar(evt) {
    var files = evt.target.files; // FileList object

    if (files.length > 0) {
        var fileToLoad = files[0];

        var fileReader = new FileReader();

        fileReader.onload = function (fileLoadedEvent) {
            var srcData = fileLoadedEvent.target.result; // <--- data: base64

            var newImage = document.createElement("img");
            newImage.src = srcData;

            saveAvatar(srcData);
        };
        fileReader.readAsDataURL(fileToLoad);
    }
}

function saveAvatar(src) {
    // NOTE: Commenting out this code since it needs to be re-written. Now using currently logged in in account graphic instead. Need to upate their account to use a different graphic
    //$('#imgAvatar').attr("src", src);
    saveToStorage(STORAGE_AVATAR_NAME, src);

    $("#imgAvatar").show();
    $("#avatarBtnText").hide();
    $("#inputAvatar").hide();
}

function getAvatar() {
    return getFromStorage(STORAGE_AVATAR_NAME || null);
}

function handleSelectToken(id) {
    var tokenId = id;
    $("#" + tokenId).addClass("list-group-item-info").siblings().removeClass("list-group-item-info");

    SELECTED_TOKEN_ID = tokenId;
}

function createToken() {
    var name = $("#name_" + SELECTED_TOKEN_ID).text();
    var src = $("#img_" + SELECTED_TOKEN_ID).attr("src");
    var size = $("#btnTokenMenu").text();

    addToken(name, src, size);
}

function addToken(name, src, size) {
    var radius = 0;

    switch (size) {
        default: // Small
            radius = UNIT_SMALL_DIAMETER;
            break;
        case "Medium":
            radius = UNIT_MEDIUM_DIAMETER;
            break;
        case "Large":
            radius = UNIT_LARGE_DIAMETER;
            break;
        case "Huge":
            radius = UNIT_HUGE_DIAMETER;
            break;
    }

    if (src.length > OBJECT_MAX_SRC_LENGTH)
        src = src.substring(0, OBJECT_MAX_SRC_LENGTH);

    // Add an obj to the board with the passed in source as it's fill
    drawCircle(cTopContext, { x: 500, y: 500 }, radius, DEFAULT_COLOR, DEFAULT_ROTATION, src);
    log("FINISHED drawToken. src length:[" + src.length + "]");
}

function handleFileSelect(evt) {
    console.log(evt);
    var files = evt.target.files; // FileList object

    if (files.length > 0) {
        var fileToLoad = files[0];

        var fileReader = new FileReader();

        fileReader.onload = function (fileLoadedEvent) {
            var srcData = fileLoadedEvent.target.result; // <--- data: base64

            var newImage = document.createElement("img");
            newImage.src = srcData;

            $("#imgToken").attr("src", srcData);
            $("#imgAvatar").attr("src", srcData);
        };
        fileReader.readAsDataURL(fileToLoad);
    }
}

function guidGenerator() {
    var s4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
}

function toRadians(deg) {
    return deg * Math.PI / 180;
}

function inchesToCanvasPixels(val) {
    return ((val / BOARD_LENGTH_INCHES) * CANVAS_WIDTH);
}

function pixelsToCanvasInches(val) {
    return ((val / CANVAS_WIDTH) * BOARD_LENGTH_INCHES);
}

function canvasDistance(pointA, pointB) {
    var a = pointA.x - pointB.x;
    var b = pointA.y - pointB.y;
    var distance = Math.sqrt(a * a + b * b); // Distance in pixels

    // Convert pixels to inches by calculating the percentage of the board
    return pixelsToCanvasInches(distance).round(2);
}

// Rounding function
Number.prototype.round = function (places) {
    return +(Math.round(this + "e+" + places) + "e-" + places);
};

window.onload = function () {
    init();
};