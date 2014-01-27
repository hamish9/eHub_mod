$(document).ready(function() {
    window.addEventListener("load", function() {
        chrome.notifications.onClicked.addListener(notificationClicked);
    });
    //Image hover for delete links					
    $(".btnDel").hover(function() {
        $(this).css('background-image', 'url(' + whitex + ')');
    }, function() {
        $(this).css('background-image', 'url(' + blackx + ')');
    });
    //create container
    $('#divContentFull').hide();
    $('#divContentFull').append('<span id="Service_Monitors" style="font-size:11px;float:left;padding:10px;"></span>').fadeIn('slow');
    $('.PageHeading').append('<span id="prcsct"></span>');
    //image paths	
    var good_img = '<img src="' + chrome.extension.getURL('images/icon_thumbsup.gif') + '"></img>',
            bad_img = '<img src="' + chrome.extension.getURL('images/redflag.gif') + '"></img>',
            //redx = chrome.extension.getURL('images/red_x.png'),
            blackx = chrome.extension.getURL("images/Black_Remove.png"),
            whitex = chrome.extension.getURL("images/White_Remove.png"),
            pageUrl = window.location.pathname,
            prevTotalRunning = 0, totalRunning = 0,
            prevTaskCount = 0, taskCount = 0,
            prevPrcsCount = 0, prcsCount = 0,
            prevJobs = [],
            currentJobs = [],
            prevPJobs = [],
            currentPJobs = [],
            jobTaskAdded = [],
            jobTaskRemoved = [],
            jobPJobAdded = [],
            jobPjobRemoved = [],
            is_eHub = (pageUrl.indexOf("eHubTasks.aspx") !== -1)
    eHubURL = 'https://navigantvitalstats.com/pgs/admin/AddeHubTask.aspx';

    //check if eHub page
    if (is_eHub) {

        //insert iframe to add job  
        $('#divContentFull').prepend('<div id="AddJob">'
                + '<iframe id="AddJobFrame" height="1000px" width="1025px"  src='
                + eHubURL + ' scrolling=no seamless><p>Your browser does not support iframes.</p></iframe>'
                + '</div>');

        //http://stackoverflow.com/questions/10301193/detect-redirect-in-iframe
        var timesRefreshed = 0;

        //detect iframe loading/refreshing
        $("iframe").load(function() {
            //if second refresh, change frame src - ie dont count first load
            if (timesRefreshed === 1) {
                $(this).attr("src", eHubURL);
            }
            //add to times resreshed counter
            timesRefreshed++;
        });

        //run function to modify eHub tasks grid
        modifyGridview();

        //run function to modify grid each time table is updated with ajax    
        $('#ctl00_cphMain_UpdatePanel1').bind('DOMSubtreeModified', DOMModificationHandler);
        // http://stackoverflow.com/questions/11084819/chrome-extension-run-content-script-on-ajax-change
        function DOMModificationHandler() {
            $(this).unbind('DOMSubtreeModified');
            setTimeout(function() {
                modifyGridview();
                $('#ctl00_cphMain_UpdatePanel1').bind('DOMSubtreeModified', DOMModificationHandler);
            }, 1);
        }

    }

    function modifyGridview() {
        //Remove LockCleaner and 24HourMonitor from grid. This needst to get rebound everytime the javascript timer updates the table.
        $('td:contains(24HourMonitor)').parent().hide();
        $('td:contains(LockCleaner)').parent().hide();

        //Re-Display LockCleaner and 24HourMonitor, indicate if running or not.
        divSvcMonitors = $('#Service_Monitors')
        divSvcMonitors.empty();

        if ($('#ctl00_cphMain_EhubTasksView tr > td:contains(24HourMonitor)').length > 0) {
            divSvcMonitors.append('24HourMonitor ' + good_img + '  ');
        } else {
            divSvcMonitors.append('24HourMonitor ' + bad_img + '  ');
        }
        if ($('#ctl00_cphMain_EhubTasksView tr > td:contains(LockCleaner)').length > 0) {
            divSvcMonitors.append('LockCleaner ' + good_img + '  ');
        } else {
            divSvcMonitors.append('LockCleaner ' + bad_img + '  ');
        }
        divSvcMonitors.fadeOut('slow');
        divSvcMonitors.fadeIn('slow');


        // Process the job tables

        tblTasksView = $('table#ctl00_cphMain_EhubTasksView tr:visible:not(:first)');
        tdTaskViewCube = $('#ctl00_cphMain_EhubTasksView tr > td:contains(cube)');
        tdTaskViewPervasive = $('#ctl00_cphMain_EhubTasksView tr > td:contains(pervasive)');
        tdTaskViewWaiting = $('#ctl00_cphMain_EhubTasksView tr > td:contains(WAITING)');
        tdTaskViewAquired = $('#ctl00_cphMain_EhubTasksView tr > td:contains(ACQUIRED)');
        tdTaskViewComplete = $('#ctl00_cphMain_EhubTasksView tr > td:contains(COMPLETE)');

        tblProcessView = $('#ctl00_cphMain_ProcessesView tr:not(:first)');


        //Count running jobs for chrome badge display
        taskCount = tblTasksView.length;
        //console.log('taskCount = ' + taskCount)
        //
        //--process view does not exist if pjob is not running. 
        //--prcess view does not use th for header uses tr, therefore -1
        prcsCount = tblProcessView.length ? tblProcessView.length : 0;
        //console.log('prcsCount = ' + prcsCount)

        //check updatepanel for tasks
        if ($('#ctl00_cphMain_EhubTasksView').length) {
            $('#prcsct').empty();
            $('#prcsct').append('<span id="prcsct"> ' + taskCount + '</span>');

            if (taskCount > 0) {

                //For WAITING PJOBS, change cell color           
                tdTaskViewWaiting.each(function() {
                    tdTaskViewPervasive.each(function() {
                        $(this).parents('tr').css({
                            background: '#FDFD9F'
                        });
                        var $del = $(this).parents('tr').find('td:eq(0) a');
                        $del.addClass('btnDel').css('background-image', 'url(' + blackx + ')').html('');

                    });
                });
                //For WAITING CUBE jobs, change cell color           
                tdTaskViewWaiting.each(function() {
                    tdTaskViewCube.each(function() {
                        $(this).parents('tr').css({
                            background: '#FDD42D'
                        });
                        var $del = $(this).parents('tr').find('td:eq(0) a');
                        $del.addClass('btnDel').css('background-image', 'url(' + blackx + ')').html('');

                    });
                });

                //For ACQUIRED jobs, change cell opacity           
                tdTaskViewAquired.each(function() {

                    $(this).parents('tr').css({opacity: 0.75, color: '#00961D'});
                });
                //For COMPLETE jobs, change cell color and remove DELETE link         
                tdTaskViewComplete.each(function() {
                    $(this).html("PROCESSING")
                    var $row = $(this).parents('tr');
                    $row.css({
                        background: '#49CE63'
                    });
                    $row.find('td:eq(0)').html("").css({
                        background: '#FFF'
                    });
                });
                //For BACKUP jobs, change cell color and remove DELETE link             
                $('#ctl00_cphMain_EhubTasksView tr > td:contains(backup)').each(function() {
                    var $row = $(this).parents('tr');
                    $row.css({
                        background: '#95FD90'
                    });
                    $row.find('td:eq(0)').html("").css({
                        background: '#FFF'
                    });
                });

                /*********** Current Tasks Array ************/
                currentJobs = [];
                tblTasksView.each(function() {
                    currentJobs.push($.trim($('td:nth-child(3)', this).text()) === '' ? //not all tasks have a job so select the name instead
                            ($('td:nth-child(2)', this).text() + ' ' + $('td:nth-child(4)', this).text()): //+ ' ' + $('td:nth-child(5)', this).text()) :
                            ($('td:nth-child(3)', this).text() + ' ' + $('td:nth-child(4)', this).text()) //+ ' ' + $('td:nth-child(5)', this).text())
                            );
                });
                //console.log(currentJobs);
                /*********** END Current Tasks Array ************/


            } else {
                currentJobs = [];
                //If rows were not fund, remove headers
                $('#ctl00_cphMain_EhubTasksView').empty();
                //Show message instead
                $('#ctl00_cphMain_EhubTasksView').prepend('<p id="waiting">Waiting...</p>');
            }
        }
        //check for pjob
        if (tblProcessView.length) {
            //For PROCESSING jobs, change cell color       
            tblProcessView.each(function() {
                $(this).css({background: '#49CE63'});
                var $del = $(this).find('td:eq(0) a');
                $del.addClass('btnDel').css('background-image', 'url(' + blackx + ')').html('');
            });
            /*********** Current PJob Array ************/
            currentPJobs = [];
            tblProcessView.each(function() {
                currentPJobs.push($.trim($('td:nth-child(4)', this).text()) === '' ? //not all tasks have a job so select the name instead
                        ($('td:nth-child(3)', this).text() + ' pJob running') :
                        ($('td:nth-child(4)', this).text() + ' pJob running')
                        );
            });
            //console.log(currentPJobs);
            /*********** END Current PJob Array ************/

        }else{
            currentPJobs = [];
        }

        //update total running
        totalRunning = taskCount + prcsCount;
        
        //compare previous running to current running
        jobTaskAdded = (_.difference(currentJobs, prevJobs));
        jobTaskRemoved = (_.difference(prevJobs, currentJobs));
        jobPJobAdded = (_.difference(currentPJobs, prevPJobs));
        jobPjobRemoved = (_.difference(prevPJobs, currentPJobs));
        
        //console.log('prev jobs ' + prevJobs);
        //console.log('current jobs ' + currentJobs);
        //console.log('+ '+jobTaskAdded);
        //console.log('- '+jobTaskRemoved); 
        //console.log(jobTaskAdded)
        //console.log('+ '+jobPJobAdded);
        //console.log('- '+jobPjobRemoved);   
        

//@TODO this should be appended to individual elements, not the front of the array
        var jobTaskUpdate = [];
        var addedUpdate =[]; 
        var remUpdate = [];

        if (jobTaskAdded.length > 0 || jobPJobAdded.length > 0)
        {
             
     addedUpdate = $.merge(jobTaskAdded,jobPJobAdded);
             $.each(addedUpdate,function(i,v){
                 addedUpdate[i] = '++ ' + v;
                 
             });
        }
      

        if (jobTaskRemoved.length > 0 || jobPjobRemoved.length > 0)
        {
             remUpdate = $.merge(jobTaskRemoved,jobPjobRemoved);
               $.each(remUpdate,function(i,v){
                   remUpdate[i] = '-- ' + v;                   
               });
        }
       
        //combine notifications
        jobTaskUpdate = $.merge(remUpdate,addedUpdate);
       
        
        //console.log('task update = ' + jobTaskUpdate)
        //console.log($.trim(jobTaskUpdate))
        //console.log('prevPrcsCount = ' + prevPrcsCount + '= prevTaskCount')
        //console.log('prevTotalRunning = ' + prevTotalRunning)
        ///console.log('totalRunning = ' + totalRunning)
        
        //notification if changes 		
        if (jobTaskUpdate.length) {

            // create JSON string array of objects for chrome.notification (rich notifications)
            var jsonJobTaskUpdate = '';
            for (var i = 0; i < jobTaskUpdate.length; i++) {
                jsonJobTaskUpdate += '{"title":" ","message":"' + jobTaskUpdate[i] + '"}'
                //add final comma only on final index
                jsonJobTaskUpdate += i === jobTaskUpdate.length - 1 ? '' : ',';
            }

            //make sure iframe reloads
            $("iframe").attr("src", eHubURL);

            //notify badge in background.js
            chrome.runtime.sendMessage({processingMsg: totalRunning.toString(), taskUpdate: jsonJobTaskUpdate}, function(response) {
            });
            //alert('Check eHub');

        }

        prevTotalRunning = totalRunning;
        prevPrcsCount = prcsCount;
        prevTaskCount = taskCount;
        prevJobs = currentJobs;
        prevPJobs = currentPJobs;

    }
});
