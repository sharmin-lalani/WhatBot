# WhatBot

### Team Members:

1. Bharat Mukheja: bkmukhej@ncsu.edu
2. Calvin Fernando: cfernan3@ncsu.edu
3. Nirav Dsouza: nedsouza@ncsu.edu
4. Ronald Joseph: rjoseph4@ncsu.edu
5. Sharmin Lalani: slalani@ncsu.edu

### Project Presentation
* [Final Presentation](https://www.youtube.com/watch?v=owYdm_jY2CU) or [Download link](Whatbot_Demo.mp4)

## REPORT

### 1. Problem that WhatBot solves

**WhatBot**, *a slack Stand-up bot*, helps solve the below problems:  

* **Time taken for stand-up:**  
A stand-up meeting is an integral part of any technology project team using agile processing. Everyday each team member  answers a set of questions regarding what they have been working on, what’s next, any problems being faced etc. 

  Now, imagine a team of 10 members. The project manager asks the same set of questions to each member **sequentially**. Assuming that each team member takes about 2-3 mins to answer the questions asked by the Project Manager. Hence, the Stand-up meeting would take minimum of 20 mins.   

  WhatBot automates the stand-up meeting by asking the same pre-defined set of questions to all the team members **simultaneously**. WhatBot then gathers the answers of all team members, consolidates them into a report and shares it with all stakeholders. 
Hence, the time taken for the stand-up is considerably reduced, and team members have flexibility in answering the standup at any time during a pre-configured window.

* **Physical presence of the participants:**
Most of the current software industry advocates remote or Work From Home(WFH). Hence, having an efficient stand-up is a challenge to the team due to the physical absence of the team members. WhatBot helps solve this problem by automatically multi-casting the pre-defined set of questions to the team members,on slack, simultaneously . Hence, the physical location of the participant is no more a constraint. The team member can answer the questions at his/her convenience, but before the end time, thereby giving the participants flexibility.

* **Management overhead on  the organiser of the stand-up:**
For any stand-up, there is always an organiser, either the project manager or team lead, who is responsible for consolidating the answers and sending out an email to all stakeholders . Hence, there is a management overhead and dependency on them and their absence may affect the efficiency of the stand-up. WhatBot helps eradicate this overhead by automatically consolidating the answers of each participant into a report(using Google Sheets) and publishes the report(using Gmail) to all the stakeholders. 


## 2. Primary Features
* **Creation and modifcation of online standup meetings:**
Before the user can start configuring the standup, he needs to complete authentication to enable Google API for Google sheets and Gmail.

To create a new standup, the user has to specify the duration (start and end time), a list of participants, a custom set of questions, and the reporting medium. These parameters can be individually modified later. 
![Modify](./../Milestone%204%20DEPLOY/UAT/UseCase3-modify.jpg)

  * Standup duration: The minimum duration for the standup is 15 minutes, as the snooze delay for an ongoing session is 10 minutes.  
  * Participants: It should be a space separated list of `Slack` user ids and channels. If a channel is specified, then all users from the channel would be included as participants.Specifying channels is useful when the number of participants is too large. We have built-in user detection so if a user id is not present, it is ignored. If no participants are configured, then standup will not occure until a valid participant is added.  
  * Question set: It should be newline separated strings of questions. Atleast 1 question needs to be configured. The user can choose to accept the default question set instead of providing a custom one.  
  * Reporting mediums: The reporting medium can either be `Email` or `Slack channel`.  
  
![Setup](./../Milestone%204%20DEPLOY/UAT/UseCase1-User2.jpg)  

* **Daily standing meeting emulation:**
At the configured `start time`, each participant receives a message to do a standup. There are 3 options - `start`, `snooze` and `ignore`.  
![Buttons](./../Milestone%204%20DEPLOY/UAT/UseCase2-Buttons.jpg)  

	* `Start`: The bot will ask the user questions one-by-one. The answers will be recorded by the bot. The user can also `Redo` the standup after answering all the questions, if the user wishes.  
  ![Start](./../Milestone%204%20DEPLOY/UAT/UseCase2-StartStandup2.jpg)

	* `Snooze`: Another option the user has is to snooze the standup for a period of 10 minutes. After that the bot will resend a reminder message to the user to complete the standup.  
  ![Snooze](./../Milestone%204%20DEPLOY/UAT/UseCase2-Snooze1.jpg)  

	* `Ignore`: A user can skip the day's standup and they won't be included in that day's report.  
  ![Ignore](./../Milestone%204%20DEPLOY/UAT/UseCase2-Ignore.jpg)  

However, there is a hard deadline to complete the standup, which is the `End Time`.  At `End Time` , all the users who haven't completed the standup will get a message stating that they cannot attempt the standup as the deadline has passed.

* **Standup meeting report generation:**
At the configured `end time`, a report is generated. The report will be sent via the configured method to all participants. There are currently 2 supported modes for report delivery. viz.`Email` and `Slack Channel`. 
  * In the first mode i.e. `Email`, the report email is sent to the Slack linked email ID  of all participants. The Email is sent from the google account configured during the authentication phase. 
  ![Email](./../Milestone%204%20DEPLOY/UAT/UseCase2-ReportEmail.jpg)  

  * The second mode i.e `Slack Channel`, the report is published to the configured Slack channel.  
  ![Slack Channel](./../Milestone%204%20DEPLOY/UAT/UseCase2-ReportChannel.jpg)  

## 3. Our reflection on the bot development process 
**Milestone 1 - Design**  
We had to come up with a problem statement to solve or simplify any software engineering task using a chatbot. We had several ideas, ranging from project management (tracking issues, code reviews, milestones, and notifications) to automated cloud deployment and testing. The major difficulty we faced was selecting a problem with very specific use cases, and polishing the scope of the problem such that it would be doable in one semester. 

Once we selected stand-up meeting automation, the next challenge we faced was architecture design, and deciding the messaging platform and technologies for coding and storage. To tackle the architecture design, we divided our functionality into modules such as bot interaction, config management, storage, reporting, authentication, etc. We decided to use Slack for messaging as it has an extensive API for developing chatbots, and Google apps for storage and reporting. This milestone helped us clearly understand the requirements. 

**Milestone 2 - BOT**  
In this milestone we focused on polishing the proposed design and came up with three of the most important use cases that we intend to showcase in the screencast. This milestone also helped us get more clarity on the modules of the bot design which would interact with external services like Gmail API and Google Sheets API.  
In this milestone we started building our code and bringing together all the individual components. Once we started coding, our understanding of the bot design and limitations increased. It also helped us gauge the amount of time to complete all features. Additionally, consistent communication within the team while delegating tasks helped us to quickly submit code changes without running into code conflicts. 
We faced hurdles in Selenium testing and mocking the service components because this was completely new to everyone in the team. We tackled this by referring to the course workshop, online references and constructive discussions within the team.
Preparing the screencast for each of the use case was a good experience.

**Milestone 3 - SERVICE**  
In previous milestones, we had used dummy config files and mocking of API calls for storing the setup and standup session data. In this milestone, we had to replace that with actual API calls and implement the internal logic to perform the services. We had to setup a Google account to use Google sheets in the backend to store the standup answers, retreive them at end time, and compile the report. We had to add one scheduling job for triggering the session at start time, and  another job for triggering reporting at end time. Also, these jobs had to be rescheduled whenever the start/end timings were modified.   
We also had to work on essential sub-flows for the robustness of the bot. For example, we added code to validate that all participants added from the channel are real users and not bots. We also updated code to verify that the standup bot is a member of reporting channel. These are essential negative testcases which were not being handled previously in our code.  
We also made bot startup easier by maintaining a config file with the latest configurations. This way the bot need not be configured each time it was restarted.
One of the most challenging task we faced was using the Google Sheets APIs to fetch and consolidate the saved standup report, fetch the participant list and employ Gmail APIs to email the report to all. The main hurdle was in figuring out the functioning of the asynchronous API callbacks, which we resolved by intensive testing and debugging.
	
**Milestone 4 - DEPLOY**  
The main focus of this milestone was to auto-deploy WhatBot application on to an EC2 instance on Amazon Web Service(AWS). The auto-deployment was carried out using **Ansible**.   
Creating the ansible playbook to auto- reserve an EC2 instance was a challenging task but was a great learning experience.We were also facing the challenge of running the bot infinitely. We solved this using the pm2 npm module. Another challenge was setting the environment variables using Ansible . There were many solutions available but we finalised the environment module of ansible due to its simplicity. While reserving the EC2 instance, we learnt about elastic IP(to assign fix IP address to an EC2 instance).  
Along with this we also focused on polishing the functioning of our bot to cover all edge cases. One major hurdle we faced was verifying that the bot is up and responsive at all times. We deployed our bot on an EC2 instance and left it running for a few days to make sure it is always responsive. We also tackled edge cases such as discontinuing the standup for each participant just before the report needs to be sent. This would avoid participants from accessing the session questions after the window has elapsed. Additionally, we disabled the modification of the configurations when a standup session is running. This was required to avoid any abnormal behavior during the session or while sending out the report. For example, if participants are removed just before the reporting function then the consolidated report would not contain the participants' answers even though they had answered for the particular session.  

Overall it was a very intense but valuable learning expereince. We learnt and practised  ***Agile process*** that is being extensively used in most of the software based company. Moreover, working in a team helped us in identifying and understanding team dynamics and prepared us well for the real-life endeavors. 

## 4.  Limitations and future work
* **Option to set the snooze timing:** Currently the snooze delay is 10 minutes for all participants, and the minimum configurable standup duration is 15 minutes. We can add a drop-down menu of timings next to the snooze button, so that each participant can select a different snooze delay for every standup session.

* **Option to configure the standup days:** For now the standup is occurring on all days of the week, during the configured window. An option can be added to set the standup days as well.

*  **Add more reporting mediums:** Right now the standup report can either be emailed to all participants or posted to a Slack channel. In future we can add more mediums, such as hosting the report on a website.

* **Standup modification during ongoing session:** We are not allowing anyone to modify standup parameters during the standup window, as some participants would have already answthered or begun answering. All modifications must be made when a session is not in progress. In future, we can let the user make modifications during the window, and inform the user that changes will take effect after the ongoing standup ends.

* **Setting the timezone:** Right now the standup start and end times are configured in the Eastern Standard Time. We can make the timezone a configurable parameter.
 
* **Offering an option to view earlier reports:** The current report is made available to all participants through the selected reporting medium. The user cannot view previous reports, or filter for the responses of any participant for a selected period. This can be a future enhancement.

* **Permissions to modify the configuration:** Currently we allow any participant to modify the standup configuration. This was necessary because we wanted the behavior to be consistent among all users and it would ease testing and evaluation of the bot features. In future, we can allow the creator of the bot to provide privileges to only certain users who would be granted access to view/modify the configuration.
