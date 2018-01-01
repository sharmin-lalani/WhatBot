var Botkit = require('botkit');
var chrono = require('chrono-node');
var fs = require('fs');
var config = require('./modules/config.js')
var standup = require('./modules/standup');
var schedule = require('node-schedule')
var util = require('util')
var report = require('./modules/report.js')
var delay = require('delay');
var db = require('./modules/sheets.js');

function StandupConfig(){
  this.startTimeHours = 0;
  this.startTimeMins = 0;
  this.endTimeHours = 0;
  this.endTimeMins = 0;
  this.questions = ["What did you accomplish yesterday?", "What will you work on today?",
                    "Is there anything blocking your progress?"];
  this.participants = [];
  this.participantNames = {};
  this.participantEmails = {};
  this.reportMedium = "";
  this.reportChannel = "";
  this.creator = "";
  this.gSheetId  = "";
  this.emailAddress = "";
}

var auth = {} // Object to obtain Google Auth details.
var botId; // Contains the bot's user id.
var standupConfig = new StandupConfig();
var isStandupSetup = 0;
var isStandupRunning = 0;
var defaultQuestions = "\t" + standupConfig.questions[0];

for(var i = 1; i < standupConfig.questions.length; i++)
  defaultQuestions += "\n\t" + standupConfig.questions[i];

var snoozeDelayMins = 10; // Snooze delay in minutes
// set this value in config file validation too
var minDuration = 15; // Minimum standup duration in minutes

var startRule = new schedule.RecurrenceRule();
startRule.dayOfWeek = [0,1,2,3,4,5,6];

var endRule = new schedule.RecurrenceRule();
endRule.dayOfWeek = [0,1,2,3,4,5,6];

var sessionJob;  // Schedule this job using startRule to conduct the daily standup session
var reportJob;   // Schedule this job using endRule to trigger reporting

var standupAnswers = {}; // TODO: storing responses locally, fetch from sheets later

var controller = Botkit.slackbot({
  debug: false,
  retry: 'Infinity',
  interactive_replies: true, // tells botkit to send button clicks into conversations
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    // Set scopes as needed. https://api.slack.com/docs/oauth-scopes
    scopes: ['bot'],
  }
);

// Setup for the Webserver - REQUIRED FOR INTERACTIVE BUTTONS
controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

function makebot() {
  this.startPrivateConversation = function (user, callback) {}
}

var _bot = new makebot();

function trackBot(bot) {
  _bot = bot;
}


/*
************************ Launching the slack app**********************************
*/

// Handle RTM timeout
controller.on('rtm_close', function(bot) {
  console.log('RTM connection is closed');
  bot.startRTM(function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Restarted RTM connection");
    }
  });
});

controller.on('create_bot',function(bot, bot_config) {
  bot.startRTM(function(err) {

    botId = bot_config.user_id;

    if (!err) {
      trackBot(bot);
    }

    // Read the config from the config file if present
    var configObj = config.validateConfigFile();

    // If the config file is present and the format is valid, use the config.
    // Useful for restarting the main process.
    if(configObj != null) {
      standupConfig = configObj;
      console.log(standupConfig);

      bot.startPrivateConversation({user: standupConfig.creator},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.addMessage({text:"Hello! I'm here to organise your standup. \n"}, 'default');
          obtainGoogleAuthCreds(convo, 1);
          convo.addMessage("I found a config file and have configured the standup parameters using it.\nYou can modify individual parameters or do a fresh setup if you want.", 'authCompleted');
        }
      });

    } else {
      // tell the user to configure a standup
      standupConfig.creator = bot_config.createdBy;
      bot.startPrivateConversation({user: standupConfig.creator},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.addMessage({text:"Hello! I'm here to organise your standup. \n"}, 'default');
          obtainGoogleAuthCreds(convo, 0);
          convo.addMessage("Let me know when you want to schedule a standup meeting.", 'authCompleted');
        }
      });
    }
  });
});

/*
************************ Authenticate Google Sheets and Gmail**********************************
*/
function obtainGoogleAuthCreds(convo, triggerScheduling) {
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');
    var SCOPES = ['https://www.googleapis.com/auth/spreadsheets','https://mail.google.com/'];

    var credentials = JSON.parse(fs.readFileSync('client_secret.json'));

    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth2 = new googleAuth();
    var oauth2Client = new auth2.OAuth2(clientId, clientSecret, redirectUrl);
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });

    convo.addMessage({text:"Let's configure Google Apps for you. Click this <"+authUrl+"|link> to authorize it.", attachments: [], action:'auth'}, 'default');

    convo.addQuestion("Enter the code from the page here: ", function (response, convo) {
      console.log('Authorization code entered =', response.text);

      oauth2Client.getToken(response.text, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        convo.addMessage("Invalid Credentials. Please try typing \'auth\' again.", 'authError');
        convo.gotoThread('authError');
        return;
      }
      oauth2Client.credentials = token;
      auth = oauth2Client;
      console.log(require('util').inspect(auth, { depth: null }));

      var gmail = google.gmail({ auth: auth, version: 'v1' });
      gmail.users.getProfile({ auth: auth, userId: 'me' }, function(err, res) {
         if (err) { console.log(err);
           convo.gotoThread('authError');
         } else {
           standupConfig.emailAddress = res.emailAddress;
           console.log("My EmailAddress: " + standupConfig.emailAddress);
           if (triggerScheduling == 1) {

             // schedule the standup job at the configured start time
             startRule.hour = standupConfig.startTimeHours;
             startRule.minute = standupConfig.startTimeMins;
             sessionJob = schedule.scheduleJob(startRule, startStandupWithParticipants);

             // schedule the report job at the configured end time
             endRule.hour = standupConfig.endTimeHours;
             endRule.minute = standupConfig.endTimeMins+1;
             reportJob = schedule.scheduleJob(endRule, shareReportWithParticipants);

             isStandupSetup = 1;
           }
           convo.gotoThread('authCompleted');
         }
      });
    }, {}, 'auth');
  });
  convo.addMessage({text: 'Awesome! The bot is now setup with Google based storage and Email for standup activities.!'}, 'authCompleted');
}

controller.hears(['auth', 'authenticate', 'authorize'], ['direct_mention', 'direct_message'], function(bot,message) {
  bot.startConversation(message, function(err, convo) {
      obtainGoogleAuthCreds(convo);
  }); // startConversation Ends
});


/*
************************ Configure a new standup **********************************
*/
controller.hears(['schedule', 'setup', 'configure'],['direct_mention', 'direct_message'], function(bot,message) {
  if (Object.keys(auth).length == 0 ) { //Auth is not configured yet.
    console.log('Auth is not configured yet');
    bot.reply(message, "Sorry! Please authenticate the Google APIs before configuring standup.");
    return;
  }

  if (isStandupRunning === 1) {
    console.log("Sorry! The standup cannot be configured when a session is active");
    bot.reply(message, "Sorry! The standup cannot be configured when a session is active.\n Try after "
      + config.getTimeIn12HourFormat(standupConfig.endTimeHours, standupConfig.endTimeMins) + ".");
    return;
  }

  bot.startConversation(message, function(err, convo) {

    convo.addMessage({text:"Let's begin configuring a new standup.", action:'askStartTime'}, 'default');

    convo.addQuestion('What time would you like to start the standup?', function (response, convo) {
      console.log('Start time entered =', response.text);

      var startTime = chrono.parseDate(response.text)
      if (startTime != null) {
        standupConfig.startTimeHours = startTime.getHours();
        standupConfig.startTimeMins = startTime.getMinutes();
        console.log("Start time = " + standupConfig.startTimeHours + ":" + standupConfig.startTimeMins);
        convo.gotoThread('askEndTime');
      }
      else {
        console.log("Start time not entered correctly");
        convo.transitionTo('askStartTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'askStartTime');


    convo.addQuestion('When would you like the standup to end?', function (response, convo) {
      console.log('End time entered =', response.text);

      // check that end time - start time > min standup duration
      var endTime = chrono.parseDate(response.text)
      if (endTime != null) {
        standupConfig.endTimeHours = endTime.getHours();
        standupConfig.endTimeMins = endTime.getMinutes();

        var windowSize = (standupConfig.endTimeHours - standupConfig.startTimeHours) * 60 +
                          (standupConfig.endTimeMins - standupConfig.startTimeMins);

        if(windowSize >= 0 && windowSize < minDuration) {// standup duration needs to be longer
          console.log('Window size too small. Taking different value from user.');
          convo.transitionTo('askEndTime', 'Standup duration should be atleast ' + minDuration + ' mins. Give me another value.');

        } else {
          console.log("End time = " + standupConfig.endTimeHours + ":" + standupConfig.endTimeMins);
          convo.gotoThread('askParticipants');
        }
      }
      else {
        console.log("End time not entered correctly");
        convo.transitionTo('askEndTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'askEndTime');


    convo.addQuestion('Who would you like to invite for the standup session?\n You may enter it as a combination of the following:\n\
          1. List of users: @<user1> ... @<userN>\n \
          2. Specific channel: #<channel-name>\n \
          E.g. @jack #general @john', function (response, convo) {

      console.log('participants=', response.text);
      standupConfig.participants = [];
      config.addParticipants(bot, response.text, standupConfig);
      convo.gotoThread('askQuestionSet');
    }, {}, 'askParticipants');


    convo.addQuestion('Following are the default questions.\n' + defaultQuestions +
    '\nWould you like to give your own question set?', [
      {
          pattern: bot.utterances.yes,
          callback: function(response, convo) {
            standupConfig.questions = [];
            console.log('Default questions not accepted.');
            convo.gotoThread('askNewSet');
          }
      },
      {
          pattern: bot.utterances.no,
          default: true,
          callback: function(response, convo) {
            console.log('Default question set accepted.');
            convo.transitionTo('askReportMedium', 'Ok! We will proceed with the default question set.');
          }
      }
    ], {}, 'askQuestionSet');


    convo.addQuestion('Give me all the questions, each on a new line, and say DONE to finish.', [
      {
        pattern: 'done',
        callback: function(response, convo) {
          // check that atleast 1 question has been given
          if(standupConfig.questions.length > 0) {
            console.log("Finished receiving questions");
            convo.gotoThread('askReportMedium');
          } else {
            console.log("No questions entered.");
            convo.transitionTo('askNewSet', 'The question set cannot be empty. I need atleast 1 question. Give me the questions again.');
          }
        }
      },
      {
        default: true,
        callback: function(response, convo) {
          console.log('questions entered =', response.text);
          config.parseQuestions(response.text, standupConfig);
          convo.silentRepeat();
        }
      }
    ], {}, 'askNewSet');


    convo.addQuestion(config.reportMediumButtons,
    function (response, convo) {
        if(response.text == "email") {
          standupConfig.reportMedium = "email";
          standupConfig.reportChannel = "";
          convo.gotoThread('lastStatement');
        } else {
          standupConfig.reportMedium = "channel";
          convo.addQuestion('Which slack channel do you want to use? E.g. #general', function (response, convo) {

            config.parseReportChannel(bot, botId, response.text, standupConfig, function(rsp) {
              switch (rsp) {
                case 0: // Success
                  standupConfig.reportMedium = "channel";
                  convo.gotoThread('lastStatement');
                  break;
                case 1: // Channel id is invalid
                  convo.transitionTo('askReportMedium', 'This channel does not exist.');
                  break;
                case 2: // Bot is NOT a member of valid channel
                convo.transitionTo('askReportMedium', 'I am not a member of this channel.');
                  break;
              }
            });
          }, {}, 'askReportMedium');

          convo.next();
        }
    }, {}, 'askReportMedium');


    convo.beforeThread('lastStatement', function(convo, next) {
      console.log('New standup config complete');
      //config.writeToConfigFile(standupConfig);

      // Create a google sheet for storing standup questions and answers
      db.createSheet(auth, addQuestionsToGoogleSheet);

      startRule.hour = standupConfig.startTimeHours;
      startRule.minute = standupConfig.startTimeMins;
      endRule.hour = standupConfig.endTimeHours;
      endRule.minute = standupConfig.endTimeMins;

      // schedule the standup jand reporting jobs, if not already scheduled
      if(typeof sessionJob == 'undefined'){
        sessionJob = schedule.scheduleJob(startRule, startStandupWithParticipants);
        reportJob = schedule.scheduleJob(endRule, shareReportWithParticipants);
        isStandupSetup = 1;
      }
      else
        {
        sessionJob.reschedule(startRule);
        reportJob.reschedule(endRule);
      }
      next();
    });

    convo.addMessage('Awesome! Your Standup is configured successfully!', 'lastStatement');

  }); // startConversation Ends
}); // hears 'schedule' ends


function addQuestionsToGoogleSheet(sheet_id){
  standupConfig.gSheetId = sheet_id;
  // Store the standup questions in the sheet's first(header) row
  db.storeQuestions(auth, standupConfig.gSheetId,'Whatbot',standupConfig.questions,function(response){
    console.log(response);
  });
  config.writeToConfigFile(standupConfig);
}
function modifyQuestionsInGoogleSheet(sheet_id){
  standupConfig.gSheetId = sheet_id;
  // Store the standup questions in the sheet's first(header) row
  db.modifyQuestions(auth, standupConfig.gSheetId,'Whatbot',standupConfig.questions,function(response){
    console.log(response);
  });
  config.writeToConfigFile(standupConfig);
}
/*
************************ Show an existing standup configuration***********************
*/
controller.hears(['show', 'display', 'view', 'see', 'check'],['direct_mention', 'direct_message'], function(bot,message) {
  bot.startConversation(message, function(err, convo) {
    if(isStandupSetup == 0) {
      convo.say("Standup has not been setup yet.")
    } else {
      convo.say('Let me show you the current configuration...');
      // Start time
      convo.say("Start time: " + config.getTimeIn12HourFormat(standupConfig.startTimeHours, standupConfig.startTimeMins));

      // End time
      convo.say("End time: " + config.getTimeIn12HourFormat(standupConfig.endTimeHours, standupConfig.endTimeMins));

      // participants
      var participantsStr = "";
      standupConfig.participants.forEach(function(val) {
       participantsStr += " <@" + val + ">";
      });
      convo.say(`Participants:${participantsStr}`);

      // Question set
      convo.say("Question Set: ");
      var i = 1;
      standupConfig.questions.forEach(function(val) {
        convo.say(i++ + ".  " + val);
      });

      // Reporting medium
      if (standupConfig.reportMedium == "channel") {
        convo.say("Reporting Medium: " + standupConfig.reportMedium + " (<#" + standupConfig.reportChannel + ">)");
      } else {
        convo.say("Reporting Medium: " + standupConfig.reportMedium + " (Bot's Email Id: " + standupConfig.emailAddress + ")");
      }
    }
  });
});

/*
************************ Editing an existing standup**********************************
*/

controller.hears(['modify', 'change', 'update', 'edit', 'reschedule'],['direct_mention', 'direct_message'], function(bot, message) {
  // check that standup exists
  if(isStandupSetup == 0) {
    bot.reply(message, "You need to setup a standup before modifying individual parameters.");
    return;
  }

  if (isStandupRunning === 1) {
    console.log("Sorry! The standup cannot be modified when a session is active");
    bot.reply(message, "Sorry! The standup cannot be modified when a session is active.\n Try after "
      + config.getTimeIn12HourFormat(standupConfig.endTimeHours, standupConfig.endTimeMins) + ".");
    return;
  }

  bot.startConversation(message, function(err, convo) {
    convo.ask(config.modifyStandupButtons,

    function (response, convo) {
      switch (response.text) {
        case "startTime":
          convo.gotoThread('editStartTime');
          break;
        case "endTime":
          convo.gotoThread('editEndTime');
          break;
        case "participants":
          convo.gotoThread('editParticipants');
          break;
        case "questionSet":
          standupConfig.questions = [];
          convo.gotoThread('editQuestionSet');
          break;
        case "reportMedium":
          convo.gotoThread('editReportMedium');
          break;
        default:
          convo.next();
      }
    });

    convo.addQuestion('What time would you like to start the standup?', function (response, convo) {
      console.log('Start time entered =', response.text);

      var startTime = chrono.parseDate(response.text);
      if (startTime != null) {
        var hrs = startTime.getHours();
        var mins = startTime.getMinutes();

        var windowSize = (standupConfig.endTimeHours - hrs) * 60 +
                          (standupConfig.endTimeMins - mins);

        //check that end time - new start time > minDuration
        if(windowSize >= 0 && windowSize < minDuration) {// standup duration needs to be longer
          console.log('Window size too small. Taking different value from user.');
          convo.transitionTo('editStartTime', 'Standup duration should be atleast ' + minDuration + ' mins. Give me another value.');

        } else {
          standupConfig.startTimeHours = hrs;
          standupConfig.startTimeMins = mins;

          console.log("Start time = " + standupConfig.startTimeHours + ":" + standupConfig.startTimeMins);

          convo.addMessage("All set! I have updated the start time to " +
                          config.getTimeIn12HourFormat(standupConfig.startTimeHours, standupConfig.startTimeMins) + ".", 'editStartTime');

          // reschedule the standup session job after the start time is modified
          startRule.hour = standupConfig.startTimeHours;
          startRule.minute = standupConfig.startTimeMins;
          sessionJob.reschedule(startRule);
          config.writeToConfigFile(standupConfig);
          convo.next();
        }
      }
      else {
        console.log("Start time not entered correctly");
        convo.transitionTo('editStartTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'editStartTime');

    convo.addQuestion('When would you like the standup to end?', function (response, convo) {
      console.log('End time entered =', response.text);

      var endTime = chrono.parseDate(response.text);
      if (endTime != null) {
        var hrs = endTime.getHours();
        var mins = endTime.getMinutes();

        var windowSize = (hrs - standupConfig.startTimeHours) * 60 +
                          (mins - standupConfig.startTimeMins);

        //check that end time - new start time > minDuration
        if(windowSize >= 0 && windowSize < minDuration) {// standup duration needs to be longer
          console.log('Window size too small. Taking different value from user.');
          convo.transitionTo('editEndTime', 'Standup duration should be atleast ' + minDuration + ' mins. Give me another value.');

        } else {
          standupConfig.endTimeHours = hrs;
          standupConfig.endTimeMins = mins;

          console.log("End time = " + standupConfig.endTimeHours + ":" + standupConfig.endTimeMins);
          convo.addMessage("All set! I have updated the end time to " +
                          config.getTimeIn12HourFormat(standupConfig.endTimeHours, standupConfig.endTimeMins) + ".", 'editEndTime');

          // reschedule the report job after the end time is modified
          endRule.hour = standupConfig.endTimeHours;
          endRule.minute = standupConfig.endTimeMins;
          reportJob.reschedule(endRule);

          config.writeToConfigFile(standupConfig);
          convo.next();
        }
      }
      else {
        console.log("End time not entered correctly");
        convo.transitionTo('editEndTime', "I'm sorry. I didn't understand you. Please give a single time value in a 12 hour clock format.\n\
        You can say things like 10 AM or 12:15pm.");
      }
    }, {}, 'editEndTime');


    convo.addQuestion(config.modifyUserButtons, function (response, convo) {
      switch (response.text) {
        case "addUsers":
          convo.addQuestion('Who would you like to invite for the standup session?\n You may enter it as a combination of the following:\n\
                1. List of users: @<user1> ... @<userN>\n \
                2. Specific channel: #<channel-name>\n \
                E.g. @jack #general @john', function (response, convo) {
            console.log('participants to add =', response.text);
            config.addParticipants(bot, response.text, standupConfig);

            convo.addMessage("All set! I have updated the participants", 'editParticipants');
            config.writeToConfigFile(standupConfig);
            convo.next();
          }, {}, 'editParticipants');
          convo.next();
          break;
        case "removeUsers":
          convo.addQuestion('Who would you like to remove from the standup session?\n You may enter it as a list of users: @<user1> ... @<userN>',
          function (response, convo) {
            console.log('participants to remove =', response.text);
            // note: participant list can be empty. This is how the standup can be cancelled until participants are added.
            config.removeParticipants(response.text, standupConfig);

            convo.addMessage("All set! I have updated the participants.", 'editParticipants');
            config.writeToConfigFile(standupConfig);
            convo.next();
          }, {}, 'editParticipants');
          convo.next();
          break;
        default:
          convo.next();
      }
    }, {}, 'editParticipants');


    convo.addQuestion('Give me all the questions, each on a new line, and say DONE to finish.', [
      {
        pattern: 'done',
        callback: function(response, convo) {
          // check that atleast 1 question has been given
          if(standupConfig.questions.length > 0) {
            console.log("Finished receiving questions");
            modifyQuestionsInGoogleSheet(standupConfig.gSheetId);
            convo.addMessage("All set! I have updated the standup questions.", 'editQuestionSet');
            convo.next();
          } else {
            console.log("No questions entered.");
            convo.transitionTo('editQuestionSet', 'The question set cannot be empty. I need atleast 1 question. Give me the questions again.');
            //convo.next();
            convo.next();
          }
        }
      },
      {
        default: true,
        callback: function(response, convo) {
          console.log('questions entered =', response.text);
          config.parseQuestions(response.text, standupConfig);
          convo.silentRepeat();
        }
      }
    ], {}, 'editQuestionSet');


    convo.addQuestion(config.reportMediumButtons,
    function (response, convo) {
        if(response.text == "email") {
          standupConfig.reportMedium = "email";
          standupConfig.reportChannel = "";
          convo.addMessage("All set! Standup reports will now be emailed to all participants.", 'editReportMedium');

          config.writeToConfigFile(standupConfig);
          convo.next();
        } else {
          convo.addQuestion('Which slack channel do you want to use? E.g. #general', function (response, convo) {

            config.parseReportChannel(bot, botId, response.text, standupConfig, function(rsp) {
              switch (rsp) {
                case 0: // Success
                  standupConfig.reportMedium = "channel";
                  config.writeToConfigFile(standupConfig);
                  convo.addMessage("All set! Standup reports will now be posted to <#" + standupConfig.reportChannel + ">.", 'exitReportMedium');
                  convo.gotoThread('exitReportMedium');
                  break;
                case 1: // Channel id is invalid
                  convo.transitionTo('editReportMedium', 'This channel does not exist.');
                  break;
                case 2: // Bot is NOT a member of valid channel
                convo.transitionTo('editReportMedium', 'I am not a member of this channel.');
                  break;
              }
            });
          }, {}, 'editReportMedium');

          convo.next();
        }
    }, {}, 'editReportMedium');

  }); // startConversation Ends
}); // hears 'schedule' ends


/*
************************ standup session **********************************
*/
var convoList = [];
function startStandupWithParticipants(){

  // standup session should not be continued if the the window closes in between.
  // If a user clicks snooze multiple times, session should terminate once standup end time is reached.
  // Making sure the conversation does not go beyond the Session time.
  schedule.scheduleJob(endRule, function() {
    for (var i = 0; i < convoList.length; i++) {
      console.log("status = " + convoList[i].status);
      if (typeof convoList[i] !== 'undefined' && convoList[i] && convoList[i].status === 'active')
        convoList[i].gotoThread('convoTimeout');
    }
  });

  isStandupRunning = 1; // The standup is ongoing.
  for (var i = 0; i < standupConfig.participants.length; i++){
    convoList = []; // Flush the list before use.
    _bot.startPrivateConversation({user: standupConfig.participants[i]},function(err,convo) {
      if (err) {
        console.log(err);
      } else {

        // Set a timer and end the conversations before Reporting time.
        convoList.push(convo);
        convo.addMessage({text:"Sorry! The Standup Session has ended for today.", action: 'timeout'}, 'convoTimeout');

        convo.ask( startStandupButtons, function (response, convo) {
          switch (response.text) {
            case "start":
              standupAnswers[response.user] = [];
              var attachment = {text: `:white_check_mark: Awesome! Let's start the standup.`, title: "Select one option."};
              _bot.replyInteractive(response, {text: "We are starting with the standup.", attachments: [attachment]});


              for(var j = 0; j < standupConfig.questions.length; j++) {
                convo.addQuestion(standupConfig.questions[j], function (response, convo) {
                  console.log('Question answered =', response.text);
                  standupAnswers[response.user].push(response.text);
                  convo.next();
                }, {}, 'askQuestion');
              }

              convo.addQuestion("We are done with the standup. Do you want to redo?", [
                {
                    pattern: _bot.utterances.yes,
                    callback: function(response, convo) {
                      standupConfig.questions = [];
                      console.log('Redoing');
                      standupAnswers[response.user] = [];
                      convo.gotoThread('askQuestion');
                    }
                },
                {
                    pattern: _bot.utterances.no,
                    default: true,
                    callback: function(response, convo) {
                      convo.addMessage(" Thanks for your responses! We are done with today's standup.", 'askQuestion');
                      convo.next();

                      db.storeAnswers(auth, standupConfig.gSheetId,standupConfig.participantNames[response.user],standupAnswers[response.user],function(res){console.log("Stored standup answers for user "+response.user);});
                    }
                }
              ], {}, 'askQuestion');

              convo.addMessage({text:"Here are your questions.", action:'askQuestion'}, 'default');
              convo.next();
              break;

            case "snooze":
              var attachment = {text: `:white_check_mark: I will remind you in ${snoozeDelayMins} minutes`, title: "Select one option."};
              _bot.replyInteractive(response, {text: "We are starting with the standup.", attachments: [attachment]});

              delay(snoozeDelayMins * 60000)
              .then(() => {
                convo.gotoThread('default');
              });
              break;

            case "ignore":
              var attachment = {text: `:white_check_mark: See you tomorrow`, title: "Select one option."};
              _bot.replyInteractive(response, {text: "We are starting with the standup.", attachments: [attachment]});
              convo.next();
              break;
          }
        });
      }
    });
  }
}

function shareReportWithParticipants(){
  isStandupRunning = 0; // The standup has ended.
  db.retrieveAllAnswersList(auth, standupConfig.gSheetId,true,processReportToSend);
}


function processReportToSend(answers){
  var rep = report.generateReport(standupConfig, answers);
  console.log('REPORT:\n', rep);

  if(standupConfig.reportMedium == "email") {
    report.emailReport(auth, standupConfig.emailAddress, rep, standupConfig.participantEmails);
  } else if(standupConfig.reportMedium == "channel") {
    report.postReportToChannel(_bot, rep, standupConfig.reportChannel);
  }
}


/*
************************ Help on how to configure a standup**********************************
*/

controller.hears(['help'],['direct_mention', 'direct_message'], function(bot,message) {
  bot.reply(message, config.helpMsg);
}); // hears 'help' ends
