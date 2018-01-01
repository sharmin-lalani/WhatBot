# WhatBot - A standup emulation bot

### **Problem Statement**

A stand-up meeting is an integral part of any technology project team using agile processing. Everyday each team member  answers a set of questions regarding what they have been working on, what’s next, any problems being faced etc. 

Now, imagine a team of 10 members. The project manager asks the same set of questions to each member sequentially . Assuming that each team member takes about 2-3 mins to answer the questions asked by the Project Manager. Hence, the Stand-up meeting would take minimum of 20 mins. 

How about automating this using a bot? Everyday, at a particular time, the bot asks the same pre-defined set of questions to all the team members simultaneously. The bot can gather the answers of all the team members, consolidate them into a report and share it with all the stakeholders. This approach provides the flexibility to the employees, as they can read the updates as per their convenience, or skip the updates that they are not interested in. This helps in saving considerable time.

Another case is when the project manager or team member is not in office, and cannot attend the stand-up. The bot will help enable information dissemination as if the whole team were physically present for the meeting. Also if some stakeholder is on leave of absence, the consolidated email will help keep the stakeholder updated as to what happened when he/she was away.


### **Bot Description**

We propose to deploy a process/agile bot that interacts with team members, records their updates, and generates a consolidated report which is shared with all stakeholders.

#### Bot Features:
* Creation of online standup meetings  
* Daily standing meeting emulation  
* Standup meeting report generation  

#### Bot Design Considerations:

* How does the bot interact with each participant?  
The bot directly messages the participant on slack at the configured time on all configured days. This eliminates the creation of a common channel solely for the purpose of conducting standup, and prevents all participants from getting a notification every time someone posts an update. 

* How are multiple standups within the same slack group handled?  
Each project within the same slack group has its own standup.
A new bot should be created for every standup.

* How are participants added to or removed from a standup?  
The creator has the following options while selecting users to be added/removed:
	1. Select specified users.
	2. Select specified user-groups.
	3. Select all users from the specified channel.

* What set of questions will the bot ask for each standup?  
The creator can either use the default set of questions (What did you do yesterday? What will you do today? Is there anything blocking you?), or define his own questions.

* When will these questions be asked?  
Standup time window need to be configured by the creator. 
For each standup day (Monday to Friday), the bot will start the standup session with each participant at the configured start time, and share all updates at the configured end time. The standup will close after the end time, and no responses will be recorded after that. If the user fails to respond during the window, his updates will be empty for that day. There will be an option to configure a reminder for users who haven’t posted their updates, before the standup closes.

* How is the standup report shared with everyone?  
The standup can be shared with all participants either through a consolidated email or a dedicated standup channel.

* Which standup configurations can be edited later?  
Ee are enabling editing for the set of questions, standup schedule, participants, and the standup report delivery method.

* Is there a way to filter out standup updates for a participant for a specified date range?  
No. This feature is out-of-scope.

#### User interaction:
Whatbot will understand basic chat commands to perform the following operations.
```
Schedule a new standup or move an existing one: schedule standup  
Whatbot will then prompt for entering the duration, participants, question set, and report delivery method.	 
	
Modify participants: add/remove participant [participant-list]
The participant-list can be a combination of the following:
	1. list of users: @<user1>, ..., @<userN>
	2. specific channel: #<channel-name>
	3. all users from the slack group: #general

Cancel/Ignore the standup for today.
(for deleting the standup, delete the bot)	 

Show when the standup is scheduled.

Replace all standup questions with a new set of questions.	
```

### **Use Cases**
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
	1. User supplies his custom standup questions.  
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
	1. Whatbot sends a reminder message to the user in 10 minutes. 
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


### **Design Sketches**
**Wireframe**
![Wireframe](https://github.ncsu.edu/nedsouza/CSC510-Project/blob/master/DESIGN/Wireframe.png)


 __**Storyboard**__

![Storyboard](https://github.ncsu.edu/nedsouza/CSC510-Project/blob/master/DESIGN_Revised/Storyboard.jpg)

### **Architecture Design**
![architecturepattern](https://github.ncsu.edu/nedsouza/CSC510-Project/blob/master/DESIGN/ArchitecturePattern.png)

#### Components  

*Slack:* All users interact with the bot using the Slack messaging platform.

*Bot Engine:* This is a central hub to synchronize the state of all the agents in the bot. The engine also acts as a communication channel between the agents. The bot engine also stores the configurations pertaining to the standup group. It keeps track of the state of the standup for each participant.

*Interaction Agent:* The bot interacts with Slack Platform using the Interaction Agent. This agent invokes the SLACK APIs to facilitate interaction between the user and the bot.	

*Reporting Agent:* The purpose of the agent is to form an email based on the report saved by the Storage Agent and uses Gmail APIs to send emails.

*Scheduling Agent:* This agent initiates and maintains the standup session on the configured days, during the configured time window, and also sends a reminder to users hwo haven't recorded their updates, before the standup closes.

*Storage Agent:* This agent collects the status pouring in from multiple users and consolidates the data to be written to Google Sheets. The agent interacts directly with the Google Sheets using REST APIs.

#### Design Pattern

**Space Responder**  
Whatbot is based on a space responder bot design pattern.
A Space Responder bot has the following characteristics.

* Reacts to messages:
Whatbot responds to chat commands, performs the corresponding action, and sends back an output/acknowledgement to the user. Examples of cases when the bot reacts to user input: creating a standup, conducting a standup session, etc

* Knows who it is talking to:
The bot knows about all the standup participants, and will respond to them accordingly. For example, only the creator of a standup will be allowed to edit the standup parameters later. Other users will be denied.

* Remembers what was previously said:
The bot knows the status of an ongoing standup session. For each user, it knows which questions have already been answered and which are pending. 

* Knows where it is being addressed:
The bot conducts standups through direct messages to the users. The bot can only be part of the report delivery channel. Thus it does not need to keep track of the state of conversations going on in multiple channels. 


#### Constraints
* The bot needs to be a part of atmost one channel (report delivery channel). There isn't a need to invite it to multiple channels. 
* A single bot handles a single standup.
* Every user interacts with the bot through direct messages.
* A Google account needs to be created for the bot, so it can send the report email via gmail and store the standup updates on google sheets.

#### References

[Bot Design Patterns](http://willschenk.com/bot-design-patterns)  
[StoryboardThat](http://www.storyboardthat.com/)	
