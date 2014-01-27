//listen for messages from gridview
chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {

            if (parseInt(request.processingMsg) === 0)
            {
                chrome.browserAction.setBadgeText({text: ''});

            }else{
                chrome.browserAction.setBadgeText({text: request.processingMsg});
                chrome.browserAction.setBadgeBackgroundColor({"color": '#49CE63'});
            } 
             
            //chrome rich notification
            showNotification(JSON.parse('[' + request.taskUpdate + ']'));
        });

/*********************RICH TEXT NOTIFICATION*****************************/

// Declare a variable to generate unique notification IDs
var noteID = 0;

function showNotification(msgTaskUpdate) {
    
    var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
    var hour = time[1] % 12 || 12;               // The prettyprinted hour.
    var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.

    var opt = {
        type: "list",
        title: hour + time[2] + ' ' + period,
        message: "",
        priority: 2,
        iconUrl: chrome.extension.getURL('images/clipboard.png'),
        items: msgTaskUpdate
    };

    chrome.notifications.create("ID="+noteID++, opt, creationCallback);

}
function creationCallback(noteID) {
    //console.log does not seem to work from background page.
    //alert("Succesfully created " + noteID + " notification");
}

