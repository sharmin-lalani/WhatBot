### Services  

Modules:

**Main / Bot engine** - handles the conversation/interaction between the bot and the user for all 3 use cases.

1. New standup
* Once the node process is started and the slack app is verified, whatbot greets the user who created the slack app,
and informs him that he can now configure a standup from scratch. 
* Alternatively, if the bot finds a valid json config file, it auto-configures the standup 
and informs the user that the standup parameters have been populated from the json file.
The user can still configure a fresh standup and overwrite the entire config, or modify individual parameters.  
This is helpful if the node process needs to be restarted. 
The standup parameters persist on file, and can be used to restore the config.
* We are storing the following standup parameters: start time, end time, participant list, question set, reporting medium (slack channel / email),
 creator, google sheets ID.
* The user can also ask the bot to show the current configuration, and ask for help to understand how to use the bot.

2. Standup session
* Each participant gets a notification every day at the configured time to take part in the standup meeting. 
* After confirming he wants to proceed, he is presented with the questions, one at a time. 
* After all questions have been answered, he can choose to redo it.

3. Modify standup
* Each parameter can be individually modified after the standup has been setup.  


**Config** - helper functions and data for storing and modifying the standup config  
* This module contains the logic for parsing and validating all the config parameters. Validation examples: verifying that the reporting channel is valid and that the bot is a member of that channel, verifying that the participants are valid slack team members, verifying that any participant entered is not a bot, fetching channel members if a channel name is entered while configuring participants, etc.
* Config file: This is a json file that stores the config backup. If the main process ever crashes/ needs to be restarted, this file is used to restore previous config. We are validating the file against a json schema to make sure that it is in the right format and all parameters hold valid values. 

**Standup** - helper functions and data for conducting a standup session with each participant
* A standup session has 3 actions: start standup, snooze, ignore for today.

**Reporting** - helper functions for report compilation and sharing 
* Reporting is triggered at configured end time.
* A consolidated report containing the responses of all participants is shared either on the configured slack channel or via E-mail. 
* We have used the nodemailer module for emailing the report using the bot's GMail address.

**Storage** - helper functions for storing/retreiving standup responses to/from google sheets
* After each participant completes his standup, his responses are stored on google sheets.
* For report generation, all responses are retreived from gsheets and sent to the reporting module. 


### Stories, Tasks, and Task Tracking  

[Trello](https://trello.com/b/xPCqntUz/milestone3)    
[Worksheet](WORKSHEET.md)

### Screencast
Please find the screen casts below:
1. [Creating a new standup](https://youtu.be/SMFj6qsHhmY)  

2. a. [Start Standup session with a user](https://youtu.be/3HFTdG7vf5k)  
   b. [Snooze Standup session with a user](https://youtu.be/JSIq8RkqGSU)  
   c. [Ignore Standup session with a user](https://youtu.be/m4XMA-Sq9R8)  

Note: We have configured the start and end times prior to recording the standup session video.   
There are periods of no activity in the video. That's because we are waiting for the standup session and reporting to be triggered at the configured times. 

3. [Editing an existing standup](https://youtu.be/8IjT-hRskKg)  
