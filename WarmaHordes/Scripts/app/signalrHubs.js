// SignalR 2 globals
var gChatHub;
var gLogHub;
var gObjHub;

// Start Chat Hub
$(function() {
    // Declare a proxy to reference the chat hub.
    gChatHub = $.connection.chatHub;

    // Create a function that the server hub can call to broadcast messages.
    gChatHub.client.chatMsg = function(name, message) {
        // Html encode display name and message.
        var encodedName = $("<div />").text(name).html();
        var encodedMsg = $("<div />").text(message).html();
        var msg = '<li class="list-group-item"><strong>' +
            encodedName +
            "</strong>:&nbsp;&nbsp;" +
            encodedMsg +
            "</li>";
        // Add the message to the page.
        $("#chatWindow").append(msg);
        $("#chatWindowDiv").stop().animate({
                scrollTop: $("#chatWindow li").last().offset().top
            },
            "fast");

        addToStorage(STORAGE_CHAT_NAME, { name: name, msg: message });
    };

    // Set initial focus to message input box.
    $("#message").focus();

    // Add listener to chat send button
    $("#sendmessage").click(function() {
        // Call the Send method on the hub.
        if ($("#message").val().length > 0)
        //gChatHub.server.send($('#displayName').val(), $('#message').val());
            gChatHub.server.send($("#message").val());
        // Clear text box and reset focus for next comment.
        $("#message").val("").focus();
    });

    // Add listener to chat textbox so Enter key works
    $("#message").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#sendmessage").click();
        }
    });
});

// Start Log Hub
$(function() {
    // Declare a proxy to reference the log hub.
    gLogHub = $.connection.logHub;

    // Create a function that the server hub can call to broadcast messages.
    gLogHub.client.logMsg = function(name, message) {
        // Html encode display name and message.
        var encodedName = $("<div />").text(name).html();
        var encodedMsg = $("<div />").text(message).html();

        // Add the message to the page.
        $("#logWindow").append(getChatListItem(encodedName, encodedMsg));
        $("#logWindowDiv").stop().animate({
                scrollTop: $("#logWindow li").last().offset().top
            },
            "fast");

        addToStorage(STORAGE_LOG_NAME, { name: name, msg: message });
    };

    // Create a function that the server hub can call to broadcast messages.
    gLogHub.client.rollDice = function(name, message) {
        // Html encode display name and message.
        var encodedName = $("<div />").text(name).html();
        var encodedMsg = $("<div />").text(message).html();

        // Add the message to the page.
        $("#logWindow").append(getLogRollListItem(encodedName, encodedMsg));
        $("#logWindowDiv").stop().animate({
                scrollTop: $("#logWindow li").last().offset().top
            },
            "fast");

        addToStorage(STORAGE_LOG_NAME, { name: name, msg: message });
    };

    // Add listener to log button
    $("#sendLogMessage").click(function() {
        // Call the Send method on the hub.
        if ($("#messageLog").val().length > 0)
            gLogHub.server.roll($("#messageLog").val());
        // Clear text box and reset focus for next comment.
        $("#messageLog").val("").focus();
    });

    // Add listener to chat textbox so Enter key works
    $("#messageLog").keyup(function(event) {
        if (event.keyCode == 13) {
            $("#sendLogMessage").click();
        }
    });
});

// Start Object Hub
$(function() {
    // Declare a proxy to reference the log hub.
    gObjHub = $.connection.objHub;

    // Create a function that the server hub can call on object creation
    gObjHub.client.addObj = function(obj) {
        cObjects.push(obj);

        // Save the client's current state to storage after updating it
        updateObjectStorage();
    };

    // Create a function that the server hub can call on object deletion
    gObjHub.client.removeObj = function(obj) {
        removeFromObjArray(obj.id);

        // Save the client's current state to storage after updating it
        updateObjectStorage();
    };

    // Create a function that the server hub can call to update client object movements
    gObjHub.client.moveObj = function(updatedObj) {
        var obj = cObjects.find(x => x.id === updatedObj.id);

        if (obj === undefined) { /* Do nothing */
        } else {
            obj.x = updatedObj.x;
            obj.y = updatedObj.y;

            // Save the client's current state to storage after updating it
            updateObjectStorage();
        }
    };

    // Create a function that the server hub can call to update entire object array
    gObjHub.client.updateObj = function(updatedObj) {
        var obj = cObjects.find(x => x.id === updatedObj.id);

        if (obj === undefined) { /* Do nothing */
        } else {
            // Update the obj
            obj.rotation = updatedObj.rotation;

            // Save the client's current state to storage after updating it
            updateObjectStorage();
        }
    };
});

// Start the  connection for all hubs
$(function() {
    // Start the connection.
    $.connection.hub.start().done(function() {
    });
});