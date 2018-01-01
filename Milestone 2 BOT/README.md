### Use Case Refinement  

#### 1) Create a new standup

Preconditions: None

Normal flow:
1. User selects the option to create a new whatbot in the slack group.
2. User supplies a unique name for the bot. (Bot name is the same as the standup name)
3. User adds participants to the standup.
4. User configures the standup duration. (time when standup begins, time when the standup is closed and shared with with all participants)
5. User accepts the default standup questions.
6. User selects dedicated channel as the report delivery method.
7. User supplies the name of the channel.
8. The bot is already a member of the dedicated channel, and the report delivery channel is successfully configured.
9. The bot indicates to the user that a new standup has been created. 

Alternative flows:  
2A. The bot name is not unique.  
	1. Slack will prompt the user to select a different bot name.  
	2. The use case continues.  

5A. The user does not accept the default standup questions.  
	1. User supplies his custome standup questions.  
	2. Use case returns to step 6.  
	
6A. The user selects a different report delivery method.
	1. User selects email.
	2. Use case returns to step 9.
	
8A. The user selects a non-existent channel or the bot is not a member of the specified channel.
	1. The user is prompted to first add the bot to the channel, and supply a valid channel name again.
	2. Use case returns to step 7.

#### 2) Standup session with a user

Preconditions: It's time for starting the standup.

Normal flow:  
1. Whatbot will inform the user that the standup window has started.
2. Whatbot will offer the user 3 options i.e 'START', 'SNOOZE' and 'IGNORE'.
3. User clicks on the 'START' button.
4. Whatbot will ask a question.
5. User will respond to the question, or enter the skip question command.
6. Steps 4 and 5 are repeated till all configured questions have been asked.
7. User is asked if he wants to redo all the questions, or submit his answers.
8. User proceeds with submit.
9. Whatbot notifies the user that his responses have been saved.

Alternative flows:  
3A. User clicks on 'SNOOZE' button.  
	1. Whatbot sends a reminder message to the user in 10 minutes. For Selenium testing, the time s configured as 10sec
	2. The use case returns to step 2.
	
3B. User clicks on 'IGNORE' button.  
	1. The user is notified that he is excluded from that day's standup report.
	2. The use case exits.
	
8A. User decides to redo all questions.  
	1. Whatbot indicates to the user that the process will be repeated.  
	2. The use case returns to step 4.  

#### 3) Edit the configuration of an existing standup

Preconditions: Standup to be edited exists.

Normal flow:  
[Subflow 1]. User wants to edit the standup schedule.  
	i. User sends a command to the Whatbot to modify the standup duration.  
   	ii. Whatbot asks the user to provide a new schedule.  
   	iii. User responds with a new time window.  
   	iv. Whatbot confirms the new schedule.  

[Subflow 2]. User wants to add/edit a reminder before the standup closes.  
	i. User sends a command to the Whatbot to modify the reminder.  
	ii. Whatbot asks the user to provide a new time for the reminder.  
	iii. User responds with a new time for the reminder.  
	iv. Whatbot confirms the new reminder time.  

[Subflow 3]. User wants to edit the participants for the standup.  
	i. User sends a command to the Whatbot to add/remove participant(s).  
	ii. Whatbot prompts for a list of participant(s).  
	iii. User responds with the list of participant(s).  
	iv. Whatbot acknowledges the changes.  

[Subflow 4]. User wants to edit the standup questions.  
	i. User sends a command to the Whatbot to modify questions.  
	ii. Whatbot asks the user to provide a new set of questions.  
	iii. User responds with the new questions.  
	iv. Whatbot confirms the new questions.  
	
[Subflow 5]. User wants to edit the standup report delivery method.  
	i. User sends a command to the Whatbot to change the report delivery method from email to channel.  
	ii. User supplies the name of the channel.  
	iii. The bot is already a member of the dedicated channel, and the report delivery channel is successfully configured.  
	Alternate Subflow 5:  
	iA. User sends a command to the Whatbot to change the report delivery method from channel to email.  
	1. Standup report delivery method is changed to email.  
	2. Use case exits.  
	iiiA. The user selects a non-existent channel or the bot is not a member of the specified channel.  
	1. The user is prompted to first add the bot to the channel, and supply a valid channel name again.  
	2. Use case returns to step ii.   

Alternative flows:  
[S1, S2, S3, S4, S5] If the user enters an invalid input then the Whatbot responds with an error message and terminates the subflow.


### Mocking Service Component
* ***Mocking the bot config file used for Use Case 2:*** Use Case 2 depends upon the bot configuration standup parameters like start time,end time, questions to be asked, participants to be added, mode of publishing the report(channel/email) etc.
For the Testing of Use case 2, we have mocked the bot configurations as a JSON file and are parsing the parameters appropriately.

* **Mocking Google spreadsheet API:** 
We are using Google Spreadsheets to store and consolidate the answers we receive from whatbot. For now we are mocking the storage of this data. When generating a report we are using mock data to simulate retrieval of answers from the Google Sheet and publish it to the Slack channel.

We have used the nock npm module to mock the google spreadsheets api. Once the end time of the standup meeting is triggered via the scheduling funciton, the bot does an HTTP GET request to get the consolidated report from the Google spreadsheets . On successful response, the bot publishes the report on the channel/email.


### Bot Implementation  
BOT Platform : Our bot is a Slack Bot. It has webhooks, events and interactive messages enabled on the SLACK API page. It is hosted currently in an AWS EC2 instance. It is written in node.js.  

Bot Integration: It is integrated with Slack API to enable it to communicate successfully with Slack. We used nodemailer module to integrate with Google's GMail API to effectively send email reports to the end users.   

### Selenium Testing  
Please find the Selenium test Maven folder [here](Selenium).  
There are 3 files:   
1. [UseCase 1](Selenium/src/test/java/NewStandupConfigTest.java) tests new standup configuration     
2. [UseCase 2](Selenium/src/test/java/StandupSession.java) tests the conversation between the user and the bot and also reporting.  
3. [UseCase 3](Selenium/src/test/java/EditStandupConfigTest.java) tests the edit configuration usecase.    


### Stories, Tasks, and Task Tracking  

Trello(https://trello.com/b/c9BAsFYW/milestone2)  
Worksheet(WORKSHEET.md)

### Screencast
Please find the screen casts below:
1. [Creating a new standup](https://youtu.be/hLl3-K6LaPo)  

2. [Standup session with a user](https://youtu.be/p7QxX7Az8ww)

3. [Editing an existing standup](https://youtu.be/Px0WkkErilQ)
